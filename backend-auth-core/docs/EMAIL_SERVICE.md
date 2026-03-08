# Email Service Configuration

## Overview

The email service uses an abstraction layer that supports multiple providers:
- **nodemailer** (default) - Free SMTP, works with Gmail, Outlook, custom SMTP
- **SendGrid** - Paid service (can be added when needed)
- **console** - Development only, logs emails to console

## Provider Selection

Set `EMAIL_PROVIDER` environment variable:
- `nodemailer` or `smtp` (default) - Uses SMTP configuration
- `sendgrid` - Uses SendGrid API (requires `SENDGRID_API_KEY`)
- `console` - Development mode, logs to console

## Free Options (Nodemailer + SMTP)

### Option 1: Gmail (Free)

Gmail allows sending via SMTP with an "App Password":

1. Enable 2FA on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Configure env vars:

```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # 16-char app password, not regular password
SMTP_FROM=your-email@gmail.com
```

**Limits:** 500 emails/day for free Gmail accounts

### Option 2: Outlook/Hotmail (Free)

```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

**Limits:** 300 emails/day for free Outlook accounts

### Option 3: Custom SMTP Server

Many hosting providers offer free SMTP:
- cPanel hosting usually includes SMTP
- Cloud providers (AWS SES free tier: 62,000 emails/month)

```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## SendGrid (Paid - Future)

**Note:** SendGrid free tier retires May 28, 2025. After that, lowest plan is $19.95/month.

To use SendGrid when needed:

1. Install package:
```bash
npm install @sendgrid/mail
```

2. Set env vars:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
SMTP_FROM=noreply@yourdomain.com  # Verified sender in SendGrid
```

3. The email service will automatically use SendGrid provider.

## Development Mode

For local development without email setup:

```env
EMAIL_PROVIDER=console
```

This logs emails to console instead of sending them. Useful for:
- Local development
- Testing without SMTP setup
- CI/CD environments

## Usage in Code

```typescript
import { sendEmail } from './services/email.service'

await sendEmail({
  to: 'user@example.com',
  subject: 'OTP Code',
  html: '<p>Your code is: <strong>123456</strong></p>',
  text: 'Your code is: 123456', // Optional, auto-generated from HTML if not provided
})
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PROVIDER` | No | `nodemailer` | Provider: `nodemailer`, `sendgrid`, or `console` |
| `SMTP_HOST` | Yes* | - | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | Yes* | - | SMTP username |
| `SMTP_PASS` | Yes* | - | SMTP password or app password |
| `SMTP_FROM` | No | `SMTP_USER` | From email address |
| `SENDGRID_API_KEY` | Yes** | - | SendGrid API key (if using SendGrid) |

\* Required when `EMAIL_PROVIDER=nodemailer` (unless in development with console fallback)
\** Required when `EMAIL_PROVIDER=sendgrid`

## Testing

The email service is tested and can be mocked in your tests:

```typescript
vi.mock('../../services/email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))
```

## Recommendations

**For Development:**
- Use `EMAIL_PROVIDER=console` - no setup needed

**For Production (Free):**
- Start with Gmail App Password (500/day limit)
- Or use your hosting provider's SMTP
- Or use AWS SES free tier (62k/month)

**For Production (Paid - When Needed):**
- SendGrid ($19.95/month for 50k emails)
- Or other providers (Mailgun, Postmark, etc.) - can add adapters following the same pattern

## Adding New Providers

The email service uses a provider interface. To add a new provider:

1. Create a new class implementing `EmailProvider` interface
2. Add case in `getEmailProvider()` function
3. Add required env vars to `env.config.ts`
4. Update this documentation

Example structure:
```typescript
class NewProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<void> {
    // Implementation
  }
}
```
