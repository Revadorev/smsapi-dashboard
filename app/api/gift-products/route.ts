import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET - lista toate produsele cadouri
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('gift_products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST - adauga produs nou (cu scraping automat)
export async function POST(req: NextRequest) {
  try {
    const { url, title, description, price, image_url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL-ul produsului este obligatoriu.' }, { status: 400 })
    }

    // Extragem PNK din URL
    const pnkMatch = url.match(/\/pd\/([A-Z0-9]+)/)
    if (!pnkMatch) {
      return NextResponse.json({ error: 'URL invalid. Nu s-a găsit codul produsului (PNK) în URL.' }, { status: 400 })
    }
    const pnk = pnkMatch[1]
    const emag_url = `https://www.emag.ro/product_details/pd/${pnk}`

    // Dacă sunt date manuale, le folosim direct
    if (title) {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('gift_products')
        .upsert({
          pnk,
          title,
          description: description || null,
          price: price || null,
          image_url: image_url || null,
          emag_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'pnk' })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // Scraping automat din eMAG
    const scraped = await scrapeEmag(url, pnk)

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('gift_products')
      .upsert({
        pnk,
        title: scraped.title || `Produs eMAG (${pnk})`,
        description: scraped.description || null,
        price: scraped.price || null,
        image_url: scraped.image_url || null,
        emag_url,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'pnk' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// DELETE - sterge produs
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID lipsă.' }, { status: 400 })

    const supabase = createServerClient()
    const { error } = await supabase.from('gift_products').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// PATCH - update produs
export async function PATCH(req: NextRequest) {
  try {
    const { id, title, description, price, image_url } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID lipsă.' }, { status: 400 })

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('gift_products')
      .update({ title, description, price, image_url, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// ——— Helper: scraping eMAG ———
async function scrapeEmag(url: string, pnk: string) {
  const result = { title: '', description: '', price: '', image_url: '' }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ro-RO,ro;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return result

    const html = await res.text()

    // Verificam daca e captcha
    if (html.includes('eMAG Captcha') || html.includes('trafic neobișnuit')) {
      return result
    }

    // og:title
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
    if (ogTitle) result.title = decodeHtmlEntities(ogTitle[1])

    // Fallback h1
    if (!result.title) {
      const h1 = html.match(/<h1[^>]*class="[^"]*page-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1) result.title = h1[1].replace(/<[^>]+>/g, '').trim()
    }

    // og:description
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
    if (ogDesc) result.description = decodeHtmlEntities(ogDesc[1])

    // og:image
    const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    if (ogImg) result.image_url = ogImg[1]

    // Pret
    const priceMatch = html.match(/class="product-new-price"[^>]*>([\d.,]+)/i)
    if (priceMatch) result.price = priceMatch[1].replace(',', '.') + ' Lei'

    // Fallback pret din JSON-LD
    if (!result.price) {
      const jsonld = html.match(/"price"\s*:\s*"?(\d+\.?\d*)"?/i)
      if (jsonld) result.price = jsonld[1] + ' Lei'
    }

  } catch {
    // Ignore scraping errors - se vor completa manual
  }

  // Fallback imagine: pattern CDN eMAG cunoscut
  if (!result.image_url) {
    result.image_url = `https://s13emagst.akamaized.net/products/emag/EMAG/images/product_${pnk}_1_fullsize.jpg`
  }

  return result
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
}
