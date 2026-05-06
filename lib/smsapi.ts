export interface SmsApiResponse {
  success: boolean
  data?: {
    count: number
    list: Array<{
      id: string
      points: number
      number: string
      date_sent: number
      submitted_number: string
      status: string
    }>
  }
  error?: {
    code: number
    message: string
  }
}

export interface SendSmsParams {
  to: string
  message: string
  from?: string
}

export interface AccountBalance {
  name: string
  email: string
  username: string
  phone_number: string
  payment_type: string
  user_type: string
  points: number
}

const SMSAPI_BASE_URL = 'https://api.smsapi.ro'

function getToken(): string {
  const token = process.env.SMSAPI_TOKEN
  if (!token) throw new Error('SMSAPI_TOKEN not configured')
  return token
}

export async function sendSms(params: SendSmsParams): Promise<SmsApiResponse> {
  const token = getToken()
  const senderName = params.from || process.env.SMSAPI_SENDER || ''

  const bodyParams: Record<string, string> = {
    to: params.to,
    message: params.message,
    format: 'json',
  }
  // Only add 'from' if we have a verified sender name
  if (senderName && senderName !== 'Test') {
    bodyParams.from = senderName
  }

  const body = new URLSearchParams(bodyParams)

  try {
    const response = await fetch(`${SMSAPI_BASE_URL}/sms.do`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const json = await response.json()

    if (json.error) {
      return {
        success: false,
        error: {
          code: json.error,
          message: json.message || 'Unknown error',
        },
      }
    }

    return {
      success: true,
      data: json,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error'
    return {
      success: false,
      error: { code: -1, message },
    }
  }
}

export async function getAccountBalance(): Promise<AccountBalance | null> {
  try {
    const token = getToken()
    const response = await fetch(`${SMSAPI_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // cache for 1 minute
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
