import { NextRequest, NextResponse } from 'next/server'

const SAMEDAY_BASE = 'https://api.sameday.ro'
const SAMEDAY_USER = process.env.SAMEDAY_USERNAME || 'corect2000API'
const SAMEDAY_PASS = process.env.SAMEDAY_PASSWORD || '^BWw1t8C'
const PICKUP_POINT = Number(process.env.SAMEDAY_PICKUP_POINT) || 422685
const CONTACT_PERSON = Number(process.env.SAMEDAY_CONTACT_PERSON) || 593698
const SERVICE_ID = Number(process.env.SAMEDAY_SERVICE_ID) || 10

async function getToken(): Promise<string> {
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
  return data.token
}

// GET /api/awb?action=counties
// GET /api/awb?action=cities&countyId=14&name=Constanta
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
      const name = searchParams.get('name') || ''
      const url = `${SAMEDAY_BASE}/api/geolocation/city?countyId=${countyId}&name=${encodeURIComponent(name)}`
      const res = await fetch(url, { headers: { 'X-AUTH-TOKEN': token } })
      const data = await res.json()
      return NextResponse.json(data.data || [])
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
      packageNumber: 1,
      packageWeight: weight || 1,
      service: SERVICE_ID,
      awbPayment: 1,
      cashOnDelivery: 0,
      insuredValue: 0,
      thirdPartyPickup: 0,
      observation: 'Cadou eMag KidGPS',
      awbRecipient: {
        name,
        phoneNumber: phone,
        address,
        cityId: Number(cityId),
        countyId: Number(countyId),
        ...(email ? { email } : {}),
      },
    }

    const res = await fetch(`${SAMEDAY_BASE}/api/client/awb`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 400 })
    }

    return NextResponse.json({ awb: data.awbNumber || data.awb || data })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
