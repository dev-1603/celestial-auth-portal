/**
 * SMS Service Abstraction
 * 
 * Provides a unified interface for sending SMS messages.
 * Supports multiple providers:
 * - Twilio (production, paid)
 * - Console (development, logs to console)
 * 
 * Usage:
 * ```typescript
 * import { sendSMS } from './services/sms.service'
 * 
 * await sendSMS({
 *   to: '+1234567890',
 *   message: 'Your OTP code is 123456'
 * })
 * ```
 */

import { env } from '../config/env.config'

export interface SMSOptions {
  to: string // E.164 format phone number (e.g., +1234567890)
  message: string
  from?: string // Optional: sender phone number or name
}

export interface SMSProvider {
  sendSMS(options: SMSOptions): Promise<void>
}

/**
 * Console SMS Provider (Development)
 * Logs SMS to console instead of actually sending
 */
class ConsoleProvider implements SMSProvider {
  async sendSMS(options: SMSOptions): Promise<void> {
    console.log('[SMS Console Provider]')
    console.log(`To: ${options.to}`)
    console.log(`Message: ${options.message}`)
    if (options.from) {
      console.log(`From: ${options.from}`)
    }
    console.log('---')
  }
}

/**
 * Twilio SMS Provider (Production)
 * Sends actual SMS via Twilio API
 */
class TwilioProvider implements SMSProvider {
  private accountSid: string
  private authToken: string
  private fromNumber: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || ''
    this.authToken = process.env.TWILIO_AUTH_TOKEN || ''
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || ''

    if (!this.accountSid || !this.authToken) {
      throw new Error(
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
      )
    }
  }

  async sendSMS(options: SMSOptions): Promise<void> {
    // Dynamic import to avoid requiring Twilio in development
    const twilio = await import('twilio')
    const client = twilio.default(this.accountSid, this.authToken)

    await client.messages.create({
      body: options.message,
      to: options.to,
      from: this.fromNumber || options.from || undefined,
    })
  }
}

/**
 * Get the configured SMS provider
 */
function getSMSProvider(): SMSProvider {
  const provider = env.SMS_PROVIDER || 'console'

  switch (provider.toLowerCase()) {
    case 'twilio':
      return new TwilioProvider()
    case 'console':
    default:
      return new ConsoleProvider()
  }
}

let cachedProvider: SMSProvider | null = null

/**
 * Send an SMS message
 * 
 * @param options - SMS options (to, message, from)
 * @throws Error if SMS provider is not configured or sending fails
 */
export async function sendSMS(options: SMSOptions): Promise<void> {
  if (!cachedProvider) {
    cachedProvider = getSMSProvider()
  }

  // Validate phone number format (E.164)
  if (!/^\+[1-9]\d{1,14}$/.test(options.to)) {
    throw new Error(`Invalid phone number format. Expected E.164 format (e.g., +1234567890), got: ${options.to}`)
  }

  try {
    await cachedProvider.sendSMS(options)
  } catch (error: any) {
    console.error('Failed to send SMS:', error)
    throw new Error(`SMS sending failed: ${error.message}`)
  }
}

/**
 * Clear cached provider (useful for testing or provider switching)
 */
export function clearSMSProviderCache(): void {
  cachedProvider = null
}
