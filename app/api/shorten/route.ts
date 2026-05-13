import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url, alias } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL-ul este obligatoriu.' }, { status: 400 })
    }

    const apiKey = process.env.TINYURL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'TINYURL_API_KEY lipsește din configurație.' }, { status: 500 })
    }

    const body: Record<string, string> = {
      url,
      domain: 'emagkid.ro',
    }
    if (alias && typeof alias === 'string' && alias.trim()) {
      body.alias = alias.trim()
    }

    const res = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok || data.code !== 0) {
      const msg = data.errors?.[0] ?? data.message ?? 'Eroare TinyURL.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ short_url: data.data.tiny_url })
  } catch {
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 })
  }
}
