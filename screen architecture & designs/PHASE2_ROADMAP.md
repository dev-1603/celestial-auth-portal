# Phase 2 Enhancement Roadmap - Celestial Auth Core

**Last Updated:** March 8, 2026  
**Status:** Planning Phase  
**Document Location:** `screen architecture & designs/PHASE2_ROADMAP.md`

---

## Executive Summary

Phase 1 of Celestial Auth Core has been successfully completed, implementing 5 core authentication methods (Email/Password, Email OTP, Magic Link, Phone OTP, OAuth with 16 providers), rate limiting, account recovery, MFA support, and session management enhancements.

Phase 2 will focus on:
1. **Advanced Monitoring & Logging** - Production-ready observability
2. **WebAuthn/Passkeys** - Modern passwordless authentication
3. **SSO (SAML)** - Enterprise Single Sign-On support

---

## 1. Advanced Monitoring & Logging

### Overview
Comprehensive logging and monitoring infrastructure for production deployments. Critical for security, performance optimization, debugging, and compliance.

### Goals
- Structured logging for all authentication events
- Security event tracking and alerting
- Performance metrics and monitoring
- Integration with monitoring tools (Datadog, Sentry, etc.)
- Audit logs for compliance

### Technical Requirements

#### Dependencies
```json
{
  "dependencies": {
    "winston": "^3.11.0",
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

**Phase 2A.1: Basic Logging Infrastructure (Week 1)**
- Set up structured logging (Winston or Pino)
- Configure log levels and formats
- Add request ID tracking middleware
- Log all authentication events
- Log all errors with stack traces

**Phase 2A.2: Event Tracking (Week 2)**
- Create `AuthEvent` and `SecurityEvent` models
- Implement event logging service
- Add event logging to all auth handlers
- Create event repository

**Phase 2A.3: Security Monitoring (Week 3)**
- Implement brute force detection
- Implement suspicious activity detection
- Create security event logging
- Set up alerts for security events

**Phase 2A.4: Performance Monitoring (Week 4)**
- Add performance metrics middleware
- Track database query times
- Track external API call times
- Set up performance alerts

### API Endpoints (Optional - for querying events)
- `GET /api/v1/admin/events` - Query authentication events (admin only)
- `GET /api/v1/admin/security-events` - Query security events (admin only)
- `GET /api/v1/admin/metrics` - Get performance metrics (admin only)

### Configuration
```json
{
  "logging": {
    "level": "info",
    "format": "json",
    "destination": "console",
    "retentionDays": 30,
    "enableSecurityEvents": true,
    "enablePerformanceMetrics": true
  },
  "monitoring": {
    "enableMetrics": true,
    "enableAlerts": true,
    "bruteForceThreshold": 5,
    "bruteForceWindowMinutes": 15
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
- **Development**: 3-4 weeks
- **Testing**: 1 week
- **Documentation**: 3 days
- **Total**: ~4-5 weeks

---

## 2. WebAuthn/Passkeys Implementation

### Overview
WebAuthn (Web Authentication API) enables passwordless authentication using biometrics (fingerprint, face recognition) or hardware security keys (YubiKey, etc.). This provides a more secure and user-friendly authentication experience.

### Goals
- Enable passwordless login via WebAuthn
- Support multiple authenticators per user
- Fallback to password if WebAuthn fails
- Support for both registration and authentication flows
- Mobile device support (Touch ID, Face ID)

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
  deviceName        String?  // User-friendly name (e.g., "iPhone 14", "YubiKey")
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
- `GET /api/v1/auth/webauthn/credentials` - List user's WebAuthn credentials (requires auth)
- `DELETE /api/v1/auth/webauthn/credentials/:id` - Remove a credential (requires auth)

#### Implementation Steps

**Phase 2B.1: Setup & Configuration (Week 1)**
- Install `@simplewebauthn/server`
- Configure Relying Party (RP) settings (RP ID, RP Name, Origin)
- Add environment variables for WebAuthn config
- Create WebAuthn service abstraction

**Phase 2B.2: Database Migration (Week 1)**
- Create `WebAuthnCredential` model
- Add migration script
- Update seed script

**Phase 2B.3: Repository Layer (Week 1)**
- `webauthn-credential.repository.ts`
- Functions: `createCredential`, `findCredentialById`, `updateCredentialCounter`, `deleteCredential`, `findUserCredentials`

**Phase 2B.4: Service Layer (Week 2)**
- `webauthn.service.ts`
- Functions: `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`

**Phase 2B.5: Handlers (Week 2)**
- `register-start.handler.ts` - Generate registration challenge
- `register-complete.handler.ts` - Verify and store credential
- `login-start.handler.ts` - Generate authentication challenge
- `login-complete.handler.ts` - Verify and issue tokens
- `credentials.handler.ts` - List/delete credentials

**Phase 2B.6: Routes & Integration (Week 3)**
- `routes.ts` - Mount all WebAuthn routes
- Integrate with existing auth flow
- Add fallback to password if WebAuthn fails

**Phase 2B.7: Tests & Documentation (Week 3-4)**
- Unit tests for all handlers
- Integration tests for full flow
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
- **Browser Compatibility**: Ensure support across major browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Support**: Handle mobile authenticators (Touch ID, Face ID, Android biometrics)
- **Fallback Strategy**: Graceful degradation if WebAuthn unavailable
- **User Experience**: Clear instructions for users setting up passkeys
- **Multiple Devices**: Support multiple passkeys per user

### Estimated Effort
- **Development**: 3-4 weeks
- **Testing**: 1 week
- **Documentation**: 3 days
- **Total**: ~5 weeks

---

## 3. SSO (SAML) Implementation

### Overview
SAML (Security Assertion Markup Language) enables enterprise Single Sign-On, allowing users to authenticate once and access multiple applications. This is critical for B2B SaaS platforms serving enterprise customers.

### Goals
- Support SAML 2.0 protocol
- Support both SP-initiated and IdP-initiated flows
- Support multiple SAML providers (Okta, Azure AD, Google Workspace, etc.)
- Attribute mapping and user provisioning
- Just-In-Time (JIT) user provisioning
- Multi-tenant support (tenant-specific SAML providers)

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

**Phase 2C.1: Setup & Configuration (Week 1)**
- Install SAML libraries
- Configure SAML service provider settings
- Generate SP certificate and metadata
- Create SAML service abstraction

**Phase 2C.2: Database Migration (Week 1)**
- Create `SAMLProvider` model
- Add migration script
- Update seed script

**Phase 2C.3: Repository Layer (Week 1)**
- `saml-provider.repository.ts`
- Functions: `createProvider`, `findProviderById`, `findProviderByEntityId`, `updateProvider`, `deleteProvider`

**Phase 2C.4: Service Layer (Week 2-3)**
- `saml.service.ts`
- Functions: `generateAuthnRequest`, `parseSAMLResponse`, `validateSAMLResponse`, `generateLogoutRequest`, `parseLogoutResponse`

**Phase 2C.5: Handlers (Week 3)**
- `initiate.handler.ts` - Generate SAML AuthnRequest
- `callback.handler.ts` - Process SAML Response, create/login user
- `slo.handler.ts` - Handle Single Logout
- `metadata.handler.ts` - Serve SAML metadata XML

**Phase 2C.6: Routes & Integration (Week 4)**
- `routes.ts` - Mount all SSO routes
- Integrate with existing auth flow
- Add user provisioning logic

**Phase 2C.7: Tests & Documentation (Week 4-5)**
- Unit tests with mock SAML responses
- Integration tests with SAML test IdP
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
- **IdP-Initiated SSO**: Support IdP-initiated flows (optional)

### Estimated Effort
- **Development**: 4-5 weeks
- **Testing**: 1-2 weeks (with real IdPs)
- **Documentation**: 1 week
- **Total**: ~7 weeks

---

## Implementation Priority & Timeline

### Recommended Order

#### Phase 2A: Monitoring & Logging (First - 4-5 weeks)
**Why First**: Critical for production readiness and security
- Enables visibility into system behavior
- Essential for debugging production issues
- Required for security incident detection
- Foundation for performance optimization

**Timeline**: Weeks 1-5

#### Phase 2B: WebAuthn/Passkeys (Second - 5 weeks)
**Why Second**: Modern passwordless authentication, growing user demand
- Improves user experience
- Enhances security
- Growing industry standard
- Less complex than SSO

**Timeline**: Weeks 6-10

#### Phase 2C: SSO (SAML) (Third - 7 weeks)
**Why Third**: Enterprise requirement, but less urgent
- Most complex implementation
- Requires extensive testing with real IdPs
- Enterprise customers can wait
- Can be done in parallel with other work if needed

**Timeline**: Weeks 11-17

### Total Phase 2 Timeline
- **Minimum**: 16-17 weeks (sequential)
- **Optimal**: 12-14 weeks (with some parallel work)
- **With Buffer**: 18-20 weeks (including testing and refinement)

---

## Success Criteria

### Monitoring & Logging
- ✅ All authentication events logged
- ✅ Security events detected and alerted
- ✅ Performance metrics tracked
- ✅ Integration with monitoring tools (Sentry, Datadog)
- ✅ Audit logs available for compliance
- ✅ Dashboard for viewing events and metrics

### WebAuthn/Passkeys
- ✅ Users can register passkeys
- ✅ Users can login with passkeys
- ✅ Multiple passkeys per user supported
- ✅ Fallback to password works
- ✅ Works on major browsers (Chrome, Firefox, Safari, Edge)
- ✅ Works on mobile devices (iOS, Android)
- ✅ Clear user instructions and error messages

### SSO (SAML)
- ✅ SP-initiated SSO flow works
- ✅ IdP-initiated SSO flow works (optional)
- ✅ Single Logout (SLO) works
- ✅ Supports major IdPs (Okta, Azure AD, Google Workspace)
- ✅ User provisioning works (JIT or pre-provisioned)
- ✅ Multi-tenant support (tenant-specific providers)
- ✅ Attribute mapping configurable
- ✅ Certificate management secure

---

## Technical Considerations

### Architecture Patterns
- Follow existing patterns (handlers, repositories, services)
- Config-driven (all features enabled/disabled via `auth.json`)
- Rate limiting applied to all new endpoints
- Consistent error handling
- Comprehensive test coverage

### Security Considerations
- **WebAuthn**: Verify attestation, prevent replay attacks, secure credential storage
- **SAML**: Validate signatures, prevent XML attacks, secure certificate storage
- **Logging**: Anonymize PII in logs, secure log storage, access control

### Performance Considerations
- **Logging**: Async logging to prevent blocking
- **WebAuthn**: Efficient credential lookup
- **SAML**: Efficient XML parsing, caching of provider configs

### Compliance Considerations
- **GDPR**: User data in logs must be anonymized
- **Audit**: All authentication events must be logged
- **Retention**: Security events retained for 1 year
- **Access Control**: Log access must be restricted and logged

---

## Dependencies & Prerequisites

### For Monitoring & Logging
- Monitoring service account (Datadog, New Relic, etc.)
- Sentry account (for error tracking)
- Log aggregation service (CloudWatch, Loggly, etc.)

### For WebAuthn
- HTTPS required (WebAuthn requires secure context)
- Domain verification
- Browser support testing

### For SSO
- SAML IdP access (Okta, Azure AD, etc.)
- SP certificate generation
- Domain verification
- Metadata exchange with IdP

---

## Questions & Decisions Needed

1. **Monitoring Tools**: Which monitoring service to use? (Datadog, New Relic, CloudWatch, etc.)
2. **WebAuthn**: Should we require WebAuthn for all users or make it optional?
3. **SSO**: Should we support OIDC in addition to SAML?
4. **User Provisioning**: For SSO, should we auto-create users or require pre-provisioning?
5. **Compliance**: Do we need GDPR/CCPA compliance features beyond logging?
6. **Multi-Tenant**: How should SSO providers be scoped (global vs tenant-specific)?
7. **IdP-Initiated SSO**: Should we support IdP-initiated flows or only SP-initiated?

---

## Next Steps

1. **Review & Approve**: Review this roadmap with stakeholders
2. **Prioritize**: Confirm implementation order based on business needs
3. **Resource Allocation**: Assign developers to each phase
4. **Tool Selection**: Choose monitoring tools and services
5. **Begin Phase 2A**: Start with Monitoring & Logging implementation

---

## Related Documents

- `backend-auth-core/docs/PHASE2_ROADMAP.md` - Technical implementation details
- `backend-auth-core/docs/LOGGING_MONITORING_PLAN.md` - Detailed logging strategy
- `backend-auth-core/PHASE1_COMPLETION_SUMMARY.md` - Phase 1 completion summary
- `backend-auth-core/docs/DEVELOPER_GUIDE.md` - Developer documentation

---

**Status**: Ready for review and approval  
**Last Updated**: March 8, 2026
