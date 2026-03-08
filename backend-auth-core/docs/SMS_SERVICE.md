# SMS Service Documentation

## Overview

The SMS service provides a unified interface for sending SMS messages, supporting multiple providers. This abstraction allows switching between providers without changing handler code.

## Providers

### 1. Console Provider (Development)
- **Provider ID:** `console`
- **Cost:** Free
- **Use Case:** Development and testing
- **Behavior:** Logs SMS messages to console instead of actually sending
- **Setup:** No configuration required

### 2. Twilio Provider (Production)
- **Provider ID:** `twilio`
- **Cost:** Paid (pay-per-SMS)
- **Use Case:** Production SMS delivery
- **Behavior:** Sends actual SMS via Twilio API
- **Setup:** Requires Twilio account and credentials

## Configuration

### Environment Variables

```bash
# SMS Provider Selection
SMS_PROVIDER=console  # or 'twilio'

# Twilio Credentials (required if SMS_PROVIDER=twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890  # Your Twilio phone number (E.164 format)
```

### Default Provider

If `SMS_PROVIDER` is not set, defaults to `console` (development mode).

## Usage

### In Code

```typescript
import { sendSMS } from '../services/sms.service'

await sendSMS({
  to: '+1234567890',  // E.164 format
  message: 'Your OTP code is 123456',
  from: '+1234567890'  // Optional, uses TWILIO_FROM_NUMBER if not provided
})
```

### Phone Number Format

- **Required:** E.164 format (`+[country code][number]`)
- **Example:** `+1234567890` (US), `+442071234567` (UK)
- **Validation:** Invalid formats will throw an error

## Provider Details

### Console Provider

**When to use:**
- Local development
- Testing
- CI/CD pipelines

**Output:**
```
[SMS Console Provider]
To: +1234567890
Message: Your OTP code is 123456
From: +1234567890
---
```

### Twilio Provider

**When to use:**
- Production environments
- Real SMS delivery

**Requirements:**
1. Twilio account (sign up at https://www.twilio.com)
2. Account SID and Auth Token from Twilio Console
3. Twilio phone number (purchased from Twilio)

**Setup Steps:**
1. Create Twilio account
2. Get Account SID and Auth Token from Console
3. Purchase a phone number (or use trial number)
4. Set environment variables:
   ```bash
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_FROM_NUMBER=+1234567890
   ```

**Cost:**
- Pay-per-SMS pricing (varies by country)
- Free trial credits available for testing

## Error Handling

The service throws errors for:
- Invalid phone number format
- Missing Twilio credentials (when using Twilio provider)
- Twilio API failures

**Example:**
```typescript
try {
  await sendSMS({ to: '+1234567890', message: 'Hello' })
} catch (error) {
  console.error('SMS failed:', error.message)
  // Handle error (log, retry, etc.)
}
```

## Testing

### Unit Tests

The SMS service is mocked in tests. See `src/services/__tests__/sms.service.test.ts` (if exists).

### Manual Testing

**Development (Console):**
```bash
SMS_PROVIDER=console npm run dev
# SMS will be logged to console
```

**Production (Twilio):**
```bash
SMS_PROVIDER=twilio \
TWILIO_ACCOUNT_SID=your_sid \
TWILIO_AUTH_TOKEN=your_token \
TWILIO_FROM_NUMBER=+1234567890 \
npm run dev
# SMS will be sent via Twilio
```

## Adding New Providers

To add a new SMS provider:

1. Create a provider class implementing `SMSProvider` interface:
   ```typescript
   class NewProvider implements SMSProvider {
     async sendSMS(options: SMSOptions): Promise<void> {
       // Implementation
     }
   }
   ```

2. Add provider selection in `getSMSProvider()`:
   ```typescript
   case 'newprovider':
     return new NewProvider()
   ```

3. Update environment variable documentation

## Best Practices

1. **Always validate phone numbers** before calling `sendSMS()`
2. **Use E.164 format** consistently
3. **Handle errors gracefully** - SMS failures shouldn't break the auth flow
4. **Log SMS in development** - Use console provider for local testing
5. **Rate limiting** - Consider implementing rate limits for SMS sending
6. **Cost monitoring** - Monitor SMS costs in production (Twilio)

## Troubleshooting

### "Invalid phone number format"
- Ensure phone number is in E.164 format: `+[country code][number]`
- Example: `+1234567890` (not `1234567890` or `(123) 456-7890`)

### "Twilio credentials not configured"
- Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` environment variables
- Or switch to console provider: `SMS_PROVIDER=console`

### "SMS sending failed"
- Check Twilio account balance
- Verify phone number is valid and verified (for trial accounts)
- Check Twilio logs in Twilio Console

## Related Documentation

- Phone OTP Handler: `src/modules/auth/phone/otp-send.handler.ts`
- SMS Service: `src/services/sms.service.ts`
- Environment Config: `src/config/env.config.ts`
