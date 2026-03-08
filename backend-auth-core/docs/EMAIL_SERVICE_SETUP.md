# Email Service Setup Guide

## Quick Start

### Option 1: Development (No Email Setup)

For local development, use console provider (logs emails to console):

```env
EMAIL_PROVIDER=console
```

No SMTP configuration needed. Emails will be logged to console.

### Option 2: Free Gmail SMTP

1. Enable 2FA on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Configure:

```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

**Limits:** 500 emails/day (free Gmail)

### Option 3: Free Outlook SMTP

```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

**Limits:** 300 emails/day (free Outlook)

## SendGrid (When You Need More)

**Note:** SendGrid free tier retires May 28, 2025. After that, $19.95/month minimum.

To use SendGrid:

1. Sign up at https://sendgrid.com
2. Get API key from dashboard
3. Verify sender email
4. Install package: `npm install @sendgrid/mail`
5. Configure:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
SMTP_FROM=verified-sender@yourdomain.com
```

## Testing Email Service

The email service is integrated into OTP send handler. To test:

1. Set up SMTP (or use `console` for dev)
2. Call `POST /api/v1/auth/email/otp/send` with email
3. Check email inbox (or console if using console provider)

## Provider Comparison

| Provider | Cost | Setup | Daily Limit | Best For |
|----------|------|-------|-------------|----------|
| **Console** | Free | None | Unlimited | Development |
| **Gmail SMTP** | Free | App Password | 500/day | Small projects |
| **Outlook SMTP** | Free | Regular password | 300/day | Small projects |
| **Custom SMTP** | Free* | Provider config | Varies | Hosting providers |
| **SendGrid** | $19.95/mo | API key | 50k/mo | Production scale |

\* Many hosting providers include free SMTP

## Troubleshooting

### "SMTP configuration required"
- Set `EMAIL_PROVIDER=console` for development, or
- Configure SMTP_HOST, SMTP_USER, SMTP_PASS

### Gmail "Authentication failed"
- Use App Password, not regular password
- Enable 2FA first
- Check that "Less secure app access" is not needed (App Password replaces this)

### Emails not arriving
- Check spam folder
- Verify SMTP credentials
- Check provider limits (Gmail: 500/day)
- Use console provider to verify code is working

## Migration Path

**Start:** `EMAIL_PROVIDER=console` (development)
**Then:** `EMAIL_PROVIDER=nodemailer` with Gmail (free, 500/day)
**Later:** `EMAIL_PROVIDER=sendgrid` when you need more volume

The code doesn't need to change - just update env vars!
