# Phase 2 Enhancement Roadmap

**Last Updated:** March 8, 2026  
**Status:** Planning Phase

## Overview

This document outlines the planned enhancements for Phase 2 of the Celestial Auth Core platform. Phase 1 focused on implementing core authentication methods (Email/Password, Email OTP, Magic Link, Phone OTP, OAuth) with rate limiting, account recovery, session management, and MFA support.

Phase 2 will focus on:
1. **WebAuthn/Passkeys** - Passwordless authentication using biometrics and security keys
2. **SSO (SAML)** - Enterprise Single Sign-On support
3. **Advanced Monitoring & Logging** - Comprehensive observability

---

## 1. WebAuthn/Passkeys Implementation

### Overview
WebAuthn (Web Authentication API) enables passwordless authentication using biometrics (fingerprint, face recognition) or hardware security keys (YubiKey, etc.). This provides a more secure and user-friendly authentication experience.

### Goals
- Enable passwordless login via WebAuthn
- Support multiple authenticators per user
- Fallback to password if WebAuthn fails
- Support for both registration and authentication flows

### Technical Requirements

#### Dependencies
```json
{
  "dependencies": {
    "@simplewebauthn/server": "^9.0.0",
    "@simplewebauthn/typescript-types": "^9.0.0"
  }
}
```

#### Database Schema Changes
```prisma
model WebAuthnCredential {
  id                String   @id @default(cuid())
  userId            String
  credentialId      String   @unique // Base64URL encoded
  publicKey         String   // Base64URL encoded
  counter           BigInt   @default(0)
  deviceType        String?  // "singleDevice" | "multiDevice" | "hardware"
  deviceName        String?  // User-friendly name
  lastUsedAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              GlobalUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([credentialId])
}
```

#### API Endpoints
- `POST /api/v1/auth/webauthn/register/start` - Begin WebAuthn registration
- `POST /api/v1/auth/webauthn/register/complete` - Complete WebAuthn registration
- `POST /api/v1/auth/webauthn/login/start` - Begin WebAuthn authentication
- `POST /api/v1/auth/webauthn/login/complete` - Complete WebAuthn authentication
- `GET /api/v1/auth/webauthn/credentials` - List user's WebAuthn credentials
- `DELETE /api/v1/auth/webauthn/credentials/:id` - Remove a credential

#### Implementation Steps
1. **Setup & Configuration**
   - Install `@simplewebauthn/server`
   - Configure Relying Party (RP) settings (RP ID, RP Name, Origin)
   - Add environment variables for WebAuthn config

2. **Database Migration**
   - Create `WebAuthnCredential` model
   - Add migration script
   - Update seed script

3. **Repository Layer**
   - `webauthn-credential.repository.ts`
   - Functions: `createCredential`, `findCredentialById`, `updateCredentialCounter`, `deleteCredential`, `findUserCredentials`

4. **Service Layer**
   - `webauthn.service.ts`
   - Functions: `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`

5. **Handlers**
   - `register-start.handler.ts` - Generate registration challenge
   - `register-complete.handler.ts` - Verify and store credential
   - `login-start.handler.ts` - Generate authentication challenge
   - `login-complete.handler.ts` - Verify and issue tokens
   - `credentials.handler.ts` - List/delete credentials

6. **Routes**
   - `routes.ts` - Mount all WebAuthn routes

7. **Tests**
   - Unit tests for all handlers
   - Integration tests for full flow

8. **Documentation**
   - Swagger/OpenAPI docs
   - Developer Guide section
   - Postman collection

### Configuration
```json
{
  "methodsConfig": {
    "passkey": {
      "enabled": true,
      "userVerification": "preferred", // "required" | "preferred" | "discouraged"
      "timeout": 60000,
      "attestation": "none" // "none" | "direct" | "indirect"
    }
  }
}
```

### Environment Variables
```env
WEBAUTHN_RP_ID=localhost  # Relying Party ID (domain)
WEBAUTHN_RP_NAME=Celestial Auth  # Relying Party Name
WEBAUTHN_ORIGIN=http://localhost:3000  # Allowed origin
```

### Challenges
- **Browser Compatibility**: Ensure support across major browsers
- **Mobile Support**: Handle mobile authenticators (Touch ID, Face ID)
- **Fallback Strategy**: Graceful degradation if WebAuthn unavailable
- **User Experience**: Clear instructions for users setting up passkeys

### Estimated Effort
- **Development**: 3-4 weeks
- **Testing**: 1 week
- **Documentation**: 3 days
- **Total**: ~5 weeks

---

## 2. SSO (SAML) Implementation

### Overview
SAML (Security Assertion Markup Language) enables enterprise Single Sign-On, allowing users to authenticate once and access multiple applications. This is critical for B2B SaaS platforms.

### Goals
- Support SAML 2.0 protocol
- Support both SP-initiated and IdP-initiated flows
- Support multiple SAML providers (Okta, Azure AD, Google Workspace, etc.)
- Attribute mapping and user provisioning

### Technical Requirements

#### Dependencies
```json
{
  "dependencies": {
    "saml2-js": "^4.0.0",
    "xml2js": "^0.6.0",
    "@types/xml2js": "^0.4.0"
  }
}
```

#### Database Schema Changes
```prisma
model SAMLProvider {
  id                String   @id @default(cuid())
  tenantId          String?  // Optional: tenant-specific provider
  name              String   // Display name
  entityId          String   // SAML Entity ID
  ssoUrl            String   // Single Sign-On URL
  sloUrl            String?  // Single Logout URL (optional)
  certificate       String   // IdP X.509 certificate (PEM)
  certificateFingerprint String? // SHA-256 fingerprint
  attributeMapping  Json     // Map SAML attributes to user fields
  enabled           Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  tenant            Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
  @@index([entityId])
}

// Add to AuthIdentity
// providerType: "saml" | "saml:okta" | "saml:azure_ad" | etc.
// providerUserId: SAML NameID or email
```

#### API Endpoints
- `GET /api/v1/auth/sso/providers` - List enabled SSO providers
- `GET /api/v1/auth/sso/{provider}/initiate` - Initiate SAML SSO (SP-initiated)
- `POST /api/v1/auth/sso/{provider}/callback` - Handle SAML response (ACS)
- `POST /api/v1/auth/sso/{provider}/slo` - Handle Single Logout (SLO)
- `GET /api/v1/auth/sso/metadata/{provider}` - SAML metadata endpoint

#### Implementation Steps
1. **Setup & Configuration**
   - Install SAML libraries
   - Configure SAML service provider settings
   - Generate SP certificate and metadata

2. **Database Migration**
   - Create `SAMLProvider` model
   - Add migration script
   - Update seed script

3. **Repository Layer**
   - `saml-provider.repository.ts`
   - Functions: `createProvider`, `findProviderById`, `findProviderByEntityId`, `updateProvider`, `deleteProvider`

4. **Service Layer**
   - `saml.service.ts`
   - Functions: `generateAuthnRequest`, `parseSAMLResponse`, `validateSAMLResponse`, `generateLogoutRequest`, `parseLogoutResponse`

5. **Handlers**
   - `initiate.handler.ts` - Generate SAML AuthnRequest
   - `callback.handler.ts` - Process SAML Response, create/login user
   - `slo.handler.ts` - Handle Single Logout
   - `metadata.handler.ts` - Serve SAML metadata XML

6. **Routes**
   - `routes.ts` - Mount all SSO routes

7. **Tests**
   - Unit tests with mock SAML responses
   - Integration tests with SAML test IdP

8. **Documentation**
   - Swagger/OpenAPI docs
   - Developer Guide section
   - SAML setup guide for admins
   - Postman collection

### Configuration
```json
{
  "providers": {
    "sso": [
      {
        "id": "okta",
        "type": "saml",
        "enabled": true,
        "displayName": "Okta SSO",
        "entityId": "https://dev-123456.okta.com",
        "ssoUrl": "https://dev-123456.okta.com/app/saml/sso",
        "attributeMapping": {
          "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
          "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
          "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
        }
      }
    ]
  }
}
```

### Environment Variables
```env
SAML_SP_ENTITY_ID=https://auth.celestial.com/saml
SAML_SP_ACS_URL=https://auth.celestial.com/api/v1/auth/sso/callback
SAML_SP_CERT_PATH=./certs/saml-sp.crt
SAML_SP_PRIVATE_KEY_PATH=./certs/saml-sp.key
```

### Challenges
- **Certificate Management**: Secure storage and rotation of SP certificates
- **Attribute Mapping**: Flexible mapping of SAML attributes to user fields
- **User Provisioning**: Auto-create users from SAML or require pre-provisioning
- **Just-In-Time (JIT) Provisioning**: Create users on first SAML login
- **Multi-Tenant**: Support tenant-specific SAML providers
- **Logout**: Handle SAML Single Logout (SLO) properly

### Estimated Effort
- **Development**: 4-5 weeks
- **Testing**: 1-2 weeks (with real IdPs)
- **Documentation**: 1 week
- **Total**: ~7 weeks

---

## 3. Advanced Monitoring & Logging

### Overview
Comprehensive logging and monitoring for production deployments. Track authentication events, errors, performance metrics, and security incidents.

### Goals
- Structured logging for all authentication events
- Security event tracking (failed logins, suspicious activity)
- Performance metrics (response times, error rates)
- Integration with monitoring tools (Datadog, New Relic, etc.)
- Audit logs for compliance

### Technical Requirements

#### Dependencies
```json
{
  "dependencies": {
    "winston": "^3.11.0",
    "winston-transport": "^4.6.0",
    "@sentry/node": "^7.0.0",
    "pino": "^8.16.0",
    "pino-http": "^8.5.0"
  }
}
```

#### Database Schema Changes
```prisma
model AuthEvent {
  id            String   @id @default(cuid())
  userId        String?
  email         String?
  eventType     String   // "login", "logout", "password_reset", "mfa_enabled", etc.
  method        String?  // "email_password", "oauth", "magic_link", etc.
  provider      String?  // OAuth provider, SSO provider, etc.
  ipAddress     String?
  userAgent     String?
  success       Boolean
  errorCode     String?
  errorMessage  String?
  metadata      Json?    // Additional event data
  createdAt     DateTime @default(now())
  
  user          GlobalUser? @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
  @@index([email])
}

model SecurityEvent {
  id            String   @id @default(cuid())
  eventType     String   // "brute_force", "suspicious_login", "account_takeover", etc.
  severity      String   // "low", "medium", "high", "critical"
  userId        String?
  email         String?
  ipAddress     String?
  userAgent     String?
  details       Json
  resolved      Boolean  @default(false)
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
  
  user          GlobalUser? @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([eventType])
  @@index([severity])
  @@index([createdAt])
  @@index([resolved])
}
```

#### Implementation Steps
1. **Logging Infrastructure**
   - Set up structured logging (Winston or Pino)
   - Configure log levels and formats
   - Add request ID tracking
   - Set up log rotation

2. **Event Tracking**
   - Create `AuthEvent` and `SecurityEvent` models
   - Implement event logging service
   - Add event logging to all auth handlers

3. **Security Monitoring**
   - Detect brute force attempts
   - Detect suspicious login patterns
   - Track account takeover attempts
   - Alert on security events

4. **Performance Monitoring**
   - Track response times
   - Monitor error rates
   - Track database query performance
   - Set up alerts for performance degradation

5. **Integration**
   - Sentry for error tracking
   - Datadog/New Relic for metrics
   - CloudWatch/Loggly for log aggregation

6. **Dashboard & Alerts**
   - Create monitoring dashboard
   - Set up alerts for critical events
   - Set up alerts for performance issues

### Logging Events
- **Authentication Events**: login, logout, token refresh, password reset
- **MFA Events**: enable, disable, verify, backup code used
- **OAuth Events**: initiate, callback, account linking
- **Security Events**: failed login, brute force, suspicious activity
- **Error Events**: validation errors, system errors, database errors

### Configuration
```json
{
  "logging": {
    "level": "info", // "debug" | "info" | "warn" | "error"
    "format": "json", // "json" | "text"
    "destination": "console", // "console" | "file" | "cloudwatch" | "datadog"
    "retentionDays": 30,
    "enableSecurityEvents": true,
    "enablePerformanceMetrics": true
  }
}
```

### Environment Variables
```env
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DESTINATION=console
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
```

### Estimated Effort
- **Development**: 2-3 weeks
- **Testing**: 1 week
- **Documentation**: 3 days
- **Total**: ~3-4 weeks

---

## Implementation Priority

### Phase 2A: Monitoring & Logging (First)
**Why**: Critical for production readiness and security
**Timeline**: 3-4 weeks
**Dependencies**: None

### Phase 2B: WebAuthn/Passkeys (Second)
**Why**: Modern passwordless authentication, growing user demand
**Timeline**: 5 weeks
**Dependencies**: None

### Phase 2C: SSO (SAML) (Third)
**Why**: Enterprise requirement, but less urgent
**Timeline**: 7 weeks
**Dependencies**: None

---

## Success Criteria

### WebAuthn/Passkeys
- ✅ Users can register passkeys
- ✅ Users can login with passkeys
- ✅ Multiple passkeys per user supported
- ✅ Fallback to password works
- ✅ Works on major browsers and mobile devices

### SSO (SAML)
- ✅ SP-initiated SSO flow works
- ✅ IdP-initiated SSO flow works (optional)
- ✅ Single Logout (SLO) works
- ✅ Supports major IdPs (Okta, Azure AD, Google Workspace)
- ✅ User provisioning works (JIT or pre-provisioned)

### Monitoring & Logging
- ✅ All authentication events logged
- ✅ Security events detected and alerted
- ✅ Performance metrics tracked
- ✅ Integration with monitoring tools
- ✅ Audit logs available for compliance

---

## Notes

- All implementations should follow the existing patterns (handlers, repositories, services)
- All endpoints should have Swagger documentation
- All handlers should have unit tests
- All features should be config-driven via `auth.json`
- All features should support rate limiting
- All features should be documented in Developer Guide

---

## Questions & Considerations

1. **WebAuthn**: Should we require WebAuthn for all users or make it optional?
2. **SSO**: Should we support OIDC in addition to SAML?
3. **Monitoring**: Should we build custom dashboards or use existing tools?
4. **Compliance**: Do we need GDPR/CCPA compliance features?
5. **Multi-Tenant**: How should SSO providers be scoped (global vs tenant-specific)?

---

**Next Steps**: Review and prioritize based on business needs, then begin Phase 2A (Monitoring & Logging).
