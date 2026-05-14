import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const SAMEDAY_BASE = 'https://api.sameday.ro'
const SAMEDAY_USER = process.env.SAMEDAY_USERNAME || 'corect2000API'
const SAMEDAY_PASS = process.env.SAMEDAY_PASSWORD || '^BWw1t8C'
const PICKUP_POINT = Number(process.env.SAMEDAY_PICKUP_POINT) || 422685
const CONTACT_PERSON = Number(process.env.SAMEDAY_CONTACT_PERSON) || 593698
const SERVICE_ID = Number(process.env.SAMEDAY_SERVICE_ID) || 7

// Module-level token cache
let cachedToken: string | null = null
let tokenExpiry = 0

interface SamedayCity {
  id: number
  name: string
  extraKM: number
  countyId: number
  countyName: string
}

// Loaded once from static JSON bundled at build time
import citiesData from '../../../public/sameday-cities.json'
const ALL_CITIES: SamedayCity[] = citiesData as SamedayCity[]

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
  tokenExpiry = now + 11 * 60 * 60 * 1000
  return data.token
}

// GET /api/awb?action=counties
// GET /api/awb?action=cities&countyId=14&name=Cluj
// POST /api/awb — creare AWB
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')

  try {
    if (action === 'history') {
      const db = createServerClient()
      const { data: rows, error } = await db
        .from('awb_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(rows || [])
    }

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

      const filtered = ALL_CITIES.filter((c) => {
        const matchCounty = String(c.countyId) === countyId
        const matchName = name.length === 0 || c.name.toLowerCase().includes(name)
        return matchCounty && matchName
      })

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
      thirdPartyPickup: 0,
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

    const awbNumber = data.awbNumber
    const awbCost = data.awbCost

    // Salvează în Supabase
    try {
      const db = createServerClient()
      const { error: insErr } = await db.from('awb_logs').insert({
        awb_number: awbNumber,
        recipient_name: name,
        recipient_phone: phone,
        recipient_email: email || null,
        recipient_address: address,
        county_id: Number(countyId),
        city_id: Number(cityId),
        weight: weight || 1,
        cost: awbCost || null,
      })
      if (insErr) console.error('[awb_logs insert]', insErr)
    } catch (e) {
      // non-fatal — AWB e creat, doar logul a eșuat
      console.error('[awb_logs insert exception]', e)
    }

    return NextResponse.json({
      awb: awbNumber,
      cost: awbCost,
      pdfLink: data.pdfLink,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
