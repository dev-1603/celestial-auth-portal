/**
 * Email Service
 * 
 * Abstraction layer for sending emails. Supports multiple providers:
 * - nodemailer (SMTP) - Free, works with Gmail, Outlook, etc.
 * - SendGrid - Paid service (can be added later)
 * 
 * Provider is selected via EMAIL_PROVIDER env var (default: 'nodemailer')
 * 
 * Usage:
 *   import { sendEmail } from './services/email.service'
 *   await sendEmail({ to: 'user@example.com', subject: 'OTP Code', html: '...' })
 */

import { env } from '../config/env.config'
import { logger } from '../lib/logger'

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<void>
}

/**
 * Nodemailer provider (SMTP)
 * Free option - works with Gmail, Outlook, custom SMTP servers
 */
class NodemailerProvider implements EmailProvider {
  private transporter: any

  constructor() {
    // Dynamic import for nodemailer (ESM)
    import('nodemailer').then((nodemailer) => {
      this.transporter = nodemailer.default.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: Number(env.SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    })
  }

  async init(): Promise<void> {
    if (!this.transporter) {
      const nodemailer = await import('nodemailer')
      this.transporter = nodemailer.default.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: Number(env.SMTP_PORT) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    await this.init() // Ensure transporter is initialized

    const from = options.from || env.SMTP_FROM || env.SMTP_USER

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html?.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    })
  }
}

/**
 * SendGrid provider (for future use)
 * Paid service - can be added when needed
 * 
 * To use: npm install @sendgrid/mail
 */
class SendGridProvider implements EmailProvider {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('SENDGRID_API_KEY is required when using SendGrid provider')
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    // Dynamic import for @sendgrid/mail (ESM)
    const sgMail = await import('@sendgrid/mail')
    sgMail.default.setApiKey(this.apiKey)

    const from = options.from || env.SMTP_FROM || 'noreply@example.com'

    await sgMail.default.send({
      to: options.to,
      from,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
  }
}

/**
 * Console provider (development only)
 * Logs emails to console instead of sending
 */
class ConsoleProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<void> {
    logger.info('Email sent (Console Provider)', {
      to: options.to,
      from: options.from || 'noreply@example.com',
      subject: options.subject,
      // Only log body in development
      ...(process.env.NODE_ENV === 'development' && {
        text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, '') : undefined),
      }),
    })
  }
}

/**
 * Get the configured email provider
 */
function getEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || 'nodemailer').toLowerCase()

  switch (provider) {
    case 'nodemailer':
    case 'smtp':
      // Validate SMTP config
      if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      if (env.NODE_ENV === 'development') {
        logger.warn(
          'SMTP not configured. Using console provider. Set SMTP_HOST, SMTP_USER, SMTP_PASS for production.',
        )
        return new ConsoleProvider()
      }
        throw new Error('SMTP configuration required: SMTP_HOST, SMTP_USER, SMTP_PASS')
      }
      return new NodemailerProvider()

    case 'sendgrid':
      return new SendGridProvider()

    case 'console':
      return new ConsoleProvider()

    default:
      throw new Error(
        `Invalid EMAIL_PROVIDER="${provider}". Valid options: nodemailer, sendgrid, console`,
      )
  }
}

// Singleton instance
let emailProvider: EmailProvider | null = null

/**
 * Send an email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!emailProvider) {
    emailProvider = getEmailProvider()
  }

  try {
    await emailProvider.sendEmail(options)
  } catch (error: any) {
    logger.error('Failed to send email', { error: error?.message ?? error })
    throw new Error(`Email sending failed: ${error.message}`)
  }
}

/**
 * Reset email provider (useful for testing)
 */
export function resetEmailProvider(): void {
  emailProvider = null
}
