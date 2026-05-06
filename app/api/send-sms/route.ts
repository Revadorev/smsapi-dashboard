import { NextRequest, NextResponse } from 'next/server'
import { sendSms } from '@/lib/smsapi'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, message, sender } = body

    // Validate inputs
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Numărul de telefon este obligatoriu.' },
        { status: 400 }
      )
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mesajul este obligatoriu.' },
        { status: 400 }
      )
    }

    // Normalize phone number (add country code if missing)
    let normalizedPhone = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '')
    if (normalizedPhone.startsWith('07') || normalizedPhone.startsWith('02')) {
      normalizedPhone = '4' + normalizedPhone
    } else if (normalizedPhone.startsWith('+')) {
      normalizedPhone = normalizedPhone.slice(1)
    }

    const db = createServerClient()

    // Insert log entry (PENDING)
    const { data: logEntry, error: insertError } = await db
      .from('sms_logs')
      .insert({
        phone_number: normalizedPhone,
        message: message.trim(),
        sender_name: (sender && sender !== 'Test') ? sender : (process.env.SMSAPI_SENDER && process.env.SMSAPI_SENDER !== 'Test' ? process.env.SMSAPI_SENDER : 'default'),
        status: 'PENDING',
      })
      .select()
      .single()

    if (insertError) {
      console.error('DB insert error:', insertError)
    }

    // Send via SMSAPI
    const result = await sendSms({
      to: normalizedPhone,
      message: message.trim(),
      from: sender || undefined,
    })

    // Update log with result
    if (logEntry?.id) {
      if (result.success && result.data?.list?.[0]) {
        const smsResult = result.data.list[0]
        await db
          .from('sms_logs')
          .update({
            status: smsResult.status ?? 'SENT',
            smsapi_id: smsResult.id,
            points: smsResult.points,
          })
          .eq('id', logEntry.id)
      } else if (!result.success) {
        await db
          .from('sms_logs')
          .update({
            status: 'ERROR',
            error_code: result.error?.code,
            error_message: result.error?.message,
          })
          .eq('id', logEntry.id)
      }
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: `Eroare SMSAPI: ${result.error?.message} (cod: ${result.error?.code})`,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'SMS trimis cu succes!',
      data: result.data,
    })
  } catch (err: unknown) {
    console.error('Send SMS error:', err)
    const message = err instanceof Error ? err.message : 'Eroare internă'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
