import { NextRequest, NextResponse } from 'next/server'

const SAMEDAY_BASE = 'https://api.sameday.ro'
const SAMEDAY_USER = process.env.SAMEDAY_USERNAME || 'corect2000API'
const SAMEDAY_PASS = process.env.SAMEDAY_PASSWORD || '^BWw1t8C'
const PICKUP_POINT = Number(process.env.SAMEDAY_PICKUP_POINT) || 422685
const CONTACT_PERSON = Number(process.env.SAMEDAY_CONTACT_PERSON) || 593698
const SERVICE_ID = Number(process.env.SAMEDAY_SERVICE_ID) || 10
const THIRD_PARTY_NAME = process.env.SAMEDAY_THIRD_PARTY_NAME || 'eMAG KidGPS'
const THIRD_PARTY_PHONE = process.env.SAMEDAY_THIRD_PARTY_PHONE || '0371781799'
const THIRD_PARTY_ADDRESS = process.env.SAMEDAY_THIRD_PARTY_ADDRESS || 'bulevardul tomis 50'
const THIRD_PARTY_COUNTY = process.env.SAMEDAY_THIRD_PARTY_COUNTY || 'Constanta'
const THIRD_PARTY_CITY = process.env.SAMEDAY_THIRD_PARTY_CITY || 'Constanta'

// Module-level cache — persists across requests in the same Node.js process
let cachedToken: string | null = null
let tokenExpiry = 0

interface SamedayCity {
  id: number
  name: string
  extraKM: number
  county: { id: number; name: string }
}

let allCitiesCache: SamedayCity[] | null = null
let citiesCacheTime = 0
const CITIES_CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

async function getToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < tokenExpiry) return cachedToken

  const res = await fetch(`${SAMEDAY_BASE}/api/authenticate`, {
    method: 'POST',
    headers: {
      'X-AUTH-USERNAME': SAMEDAY_USER,
      'X-AUTH-PASSWORD': SAMEDAY_PASS,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!data.token) throw new Error('SameDay auth failed')
  cachedToken = data.token
  tokenExpiry = now + 11 * 60 * 60 * 1000 // 11h (token valid 12h)
  return data.token
}

async function getAllCities(token: string): Promise<SamedayCity[]> {
  const now = Date.now()
  if (allCitiesCache && now - citiesCacheTime < CITIES_CACHE_TTL) {
    return allCitiesCache
  }

  // Fetch all pages (28 pages × 500 = ~13776 cities)
  const firstRes = await fetch(
    `${SAMEDAY_BASE}/api/geolocation/city?countPerPage=500&page=1`,
    { headers: { 'X-AUTH-TOKEN': token } }
  )
  const firstData = await firstRes.json()
  const totalPages: number = firstData.pages || 1
  const cities: SamedayCity[] = [...(firstData.data || [])]

  // Fetch remaining pages in parallel (batches of 5)
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
  for (let i = 0; i < remaining.length; i += 5) {
    const batch = remaining.slice(i, i + 5)
    const results = await Promise.all(
      batch.map((page) =>
        fetch(`${SAMEDAY_BASE}/api/geolocation/city?countPerPage=500&page=${page}`, {
          headers: { 'X-AUTH-TOKEN': token },
        }).then((r) => r.json())
      )
    )
    for (const r of results) {
      cities.push(...(r.data || []))
    }
  }

  allCitiesCache = cities
  citiesCacheTime = now
  return cities
}

// GET /api/awb?action=counties
// GET /api/awb?action=cities&countyId=14&name=Cluj
// POST /api/awb — creare AWB
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')

  try {
    const token = await getToken()

    if (action === 'counties') {
      const res = await fetch(`${SAMEDAY_BASE}/api/geolocation/county?countryId=1`, {
        headers: { 'X-AUTH-TOKEN': token },
      })
      const data = await res.json()
      return NextResponse.json(data.data || [])
    }

    if (action === 'cities') {
      const countyId = searchParams.get('countyId')
      const name = (searchParams.get('name') || '').toLowerCase().trim()

      if (!countyId) return NextResponse.json([])

      const allCities = await getAllCities(token)

      // Filter by countyId, then optionally by name substring
      const filtered = allCities.filter((c) => {
        const matchCounty = String(c.county.id) === countyId
        const matchName = name.length === 0 || c.name.toLowerCase().includes(name)
        return matchCounty && matchName
      })

      // Sort alphabetically, limit to 100
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ro'))
      return NextResponse.json(filtered.slice(0, 100))
    }

    return NextResponse.json({ error: 'Action necunoscuta' }, { status: 400 })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, address, countyId, cityId, weight } = body

    if (!name || !phone || !address || !countyId || !cityId) {
      return NextResponse.json({ error: 'Completați toate câmpurile obligatorii.' }, { status: 400 })
    }

    const token = await getToken()

    const payload = {
      pickupPoint: PICKUP_POINT,
      contactPerson: CONTACT_PERSON,
      packageType: 1,
      service: SERVICE_ID,
      awbPayment: 1,
      cashOnDelivery: 0,
      insuredValue: 0,
      thirdPartyPickup: 1,
      thirdParty: {
        name: THIRD_PARTY_NAME,
        phoneNumber: THIRD_PARTY_PHONE,
        personType: 0,
        address: THIRD_PARTY_ADDRESS,
        countyString: THIRD_PARTY_COUNTY,
        cityString: THIRD_PARTY_CITY,
      },
      observation: 'Cadou eMag KidGPS',
      parcels: [{ weight: weight || 1 }],
      awbRecipient: {
        name,
        phoneNumber: phone,
        personType: 0,
        address,
        county: Number(countyId),
        city: Number(cityId),
        ...(email ? { email } : {}),
      },
    }

    const res = await fetch(`${SAMEDAY_BASE}/api/awb`, {
      method: 'POST',
      headers: {
        'X-AUTH-TOKEN': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok || data.code === 400) {
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 400 })
    }

    return NextResponse.json({
      awb: data.awbNumber,
      cost: data.awbCost,
      pdfLink: data.pdfLink,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
