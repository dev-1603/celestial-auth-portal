/**
 * Email Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmail, resetEmailProvider, type EmailOptions } from '../email.service'

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    })),
  },
}))

// Mock env config
vi.mock('../../config/env.config', () => ({
  env: {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_USER: 'test@example.com',
    SMTP_PASS: 'password',
    SMTP_FROM: 'noreply@example.com',
    NODE_ENV: 'test',
  },
}))

describe('email.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetEmailProvider()
    process.env.EMAIL_PROVIDER = 'nodemailer'
  })

  it('sends email via nodemailer when EMAIL_PROVIDER=nodemailer', async () => {
    const options: EmailOptions = {
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    }

    await sendEmail(options)

    // Verify nodemailer was called (transporter.sendMail)
    const nodemailer = await import('nodemailer')
    expect(nodemailer.default.createTransport).toHaveBeenCalled()
  })

  it('uses console provider in development when SMTP not configured', async () => {
    process.env.EMAIL_PROVIDER = 'console'
    resetEmailProvider()

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const options: EmailOptions = {
      to: 'user@example.com',
      subject: 'Test Email',
      text: 'Test content',
    }

    await sendEmail(options)

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('throws error for invalid provider', async () => {
    process.env.EMAIL_PROVIDER = 'invalid'
    resetEmailProvider()

    const options: EmailOptions = {
      to: 'user@example.com',
      subject: 'Test',
      text: 'Test',
    }

    await expect(sendEmail(options)).rejects.toThrow('Invalid EMAIL_PROVIDER')
  })
})
