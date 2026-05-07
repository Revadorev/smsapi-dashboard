import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET - lista toate templatele
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST - adauga template nou
export async function POST(req: NextRequest) {
  try {
    const { name, content } = await req.json()
    if (!name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Completați toate câmpurile.' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('sms_templates')
      .insert({ name: name.trim(), content: content.trim() })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// PATCH - editare template
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, content } = await req.json()
    if (!id || !name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Date incomplete.' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('sms_templates')
      .update({ name: name.trim(), content: content.trim() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// DELETE - sterge template
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID lipsă.' }, { status: 400 })

    const supabase = createServerClient()
    const { error } = await supabase.from('sms_templates').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
