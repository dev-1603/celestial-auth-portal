# Logging & Monitoring Plan

**Last Updated:** March 8, 2026  
**Status:** Planning Phase

## Overview

This document outlines the logging and monitoring strategy for Celestial Auth Core. Proper logging and monitoring are critical for:
- **Security**: Detecting and responding to security incidents
- **Performance**: Identifying bottlenecks and optimizing
- **Debugging**: Troubleshooting issues in production
- **Compliance**: Meeting audit and regulatory requirements

---

## 1. Logging Strategy

### 1.1 Log Levels

We'll use standard log levels with clear definitions:

- **DEBUG**: Detailed information for debugging (development only)
- **INFO**: General informational messages (normal operations)
- **WARN**: Warning messages (potential issues, but system continues)
- **ERROR**: Error messages (operations failed, but system continues)
- **FATAL**: Critical errors (system may be unable to continue)

### 1.2 Structured Logging

All logs will be in JSON format for easy parsing and analysis:

```json
{
  "timestamp": "2026-03-08T10:30:00.000Z",
  "level": "info",
  "message": "User logged in successfully",
  "requestId": "req_abc123",
  "userId": "user_xyz789",
  "email": "user@example.com",
  "method": "email_password",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "duration": 125,
  "metadata": {
    "tenantId": "tenant_123",
    "role": "USER"
  }
}
```

### 1.3 Log Categories

#### Authentication Events
- Login attempts (success/failure)
- Logout events
- Token refresh
- Password reset requests/completions
- MFA enable/disable/verify
- OAuth flows (initiate, callback)
- Magic link send/verify
- Phone OTP send/verify

#### Security Events
- Failed login attempts (brute force detection)
- Suspicious login patterns (new device, new location)
- Account takeover attempts
- Rate limit violations
- Invalid token usage
- Unauthorized access attempts

#### System Events
- Application startup/shutdown
- Database connection issues
- External service failures (email, SMS, OAuth)
- Configuration changes
- Migration execution

#### Performance Events
- Slow database queries
- High response times
- Memory/CPU usage
- Rate limit hits

### 1.4 Log Storage

#### Development
- Console output (pretty-printed)
- Optional: Local file logging

#### Production
- **Primary**: Cloud log aggregation service (CloudWatch, Datadog, Loggly)
- **Backup**: Database storage for critical events (AuthEvent, SecurityEvent)
- **Retention**: 30 days for general logs, 1 year for security events

---

## 2. Monitoring Strategy

### 2.1 Metrics to Track

#### Authentication Metrics
- Login success/failure rate
- Average login time
- Token refresh rate
- Password reset request rate
- MFA adoption rate
- OAuth provider usage

#### Security Metrics
- Failed login attempts per IP/user
- Brute force detection rate
- Suspicious activity rate
- Rate limit violations
- Account lockout rate

#### Performance Metrics
- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- External API call time (email, SMS, OAuth)
- Memory usage
- CPU usage

#### Business Metrics
- Daily active users (DAU)
- New user registrations
- Authentication method distribution
- Tenant activity

### 2.2 Alerting Rules

#### Critical Alerts (Immediate Response)
- **High Error Rate**: > 5% error rate for 5 minutes
- **Database Down**: Database connection failures
- **Security Incident**: Brute force detected, account takeover attempt
- **Service Down**: Application unresponsive

#### Warning Alerts (Investigate Soon)
- **Elevated Error Rate**: > 2% error rate for 15 minutes
- **Performance Degradation**: p95 latency > 1 second for 10 minutes
- **High Failed Login Rate**: > 10 failed logins per minute
- **Rate Limit Violations**: > 100 violations per minute

#### Info Alerts (Monitor)
- **High Traffic**: 2x normal traffic
- **New User Spike**: 2x normal registration rate
- **OAuth Provider Issues**: Provider callback failures

### 2.3 Monitoring Tools

#### Recommended Stack
1. **Application Monitoring**: Datadog, New Relic, or Sentry
2. **Error Tracking**: Sentry
3. **Log Aggregation**: CloudWatch, Datadog, or Loggly
4. **Uptime Monitoring**: Pingdom, UptimeRobot
5. **Database Monitoring**: Prisma Studio, database-specific tools

---

## 3. Implementation Plan

### 3.1 Phase 1: Basic Logging (Week 1)

#### Tasks
1. Install logging library (Winston or Pino)
2. Set up structured logging format
3. Add request ID middleware
4. Log all authentication events
5. Log all errors with stack traces

#### Files to Create/Modify
- `src/lib/logger.ts` - Logger configuration
- `src/middleware/requestLogger.ts` - Request logging middleware
- `src/middleware/errorLogger.ts` - Error logging middleware
- Update all handlers to use logger

#### Example Implementation
```typescript
// src/lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
})

// src/middleware/requestLogger.ts
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID()
  req.requestId = requestId
  
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })
  })
  
  next()
}
```

### 3.2 Phase 2: Event Tracking (Week 2)

#### Tasks
1. Create `AuthEvent` and `SecurityEvent` models
2. Create event logging service
3. Add event logging to all auth handlers
4. Create event repository

#### Database Migration
```prisma
model AuthEvent {
  id            String   @id @default(cuid())
  userId        String?
  email         String?
  eventType     String
  method        String?
  provider      String?
  ipAddress     String?
  userAgent     String?
  success       Boolean
  errorCode     String?
  errorMessage  String?
  metadata      Json?
  createdAt     DateTime @default(now())
  
  user          GlobalUser? @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}

model SecurityEvent {
  id            String   @id @default(cuid())
  eventType     String
  severity      String
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
}
```

#### Service Implementation
```typescript
// src/services/event-logger.service.ts
export async function logAuthEvent(data: {
  userId?: string
  email?: string
  eventType: string
  method?: string
  provider?: string
  success: boolean
  errorCode?: string
  errorMessage?: string
  metadata?: any
  req?: Request
}): Promise<void> {
  // Log to database
  await prisma.authEvent.create({
    data: {
      userId: data.userId,
      email: data.email,
      eventType: data.eventType,
      method: data.method,
      provider: data.provider,
      ipAddress: data.req?.ip,
      userAgent: data.req?.get('user-agent'),
      success: data.success,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
    },
  })
  
  // Also log to application logger
  logger.info({
    eventType: 'auth_event',
    ...data,
  })
}
```

### 3.3 Phase 3: Security Monitoring (Week 3)

#### Tasks
1. Implement brute force detection
2. Implement suspicious activity detection
3. Create security event logging
4. Set up alerts for security events

#### Brute Force Detection
```typescript
// src/services/security-monitor.service.ts
export async function detectBruteForce(
  email: string,
  ipAddress: string,
): Promise<boolean> {
  // Check failed login attempts in last 15 minutes
  const recentFailures = await prisma.authEvent.count({
    where: {
      email,
      eventType: 'login',
      success: false,
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000),
      },
    },
  })
  
  if (recentFailures >= 5) {
    await logSecurityEvent({
      eventType: 'brute_force',
      severity: 'high',
      email,
      ipAddress,
      details: { failedAttempts: recentFailures },
    })
    return true
  }
  
  return false
}
```

### 3.4 Phase 4: Performance Monitoring (Week 4)

#### Tasks
1. Add performance metrics middleware
2. Track database query times
3. Track external API call times
4. Set up performance alerts

#### Performance Middleware
```typescript
// src/middleware/performance.ts
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // Track slow requests
    if (duration > 1000) {
      logger.warn({
        eventType: 'slow_request',
        path: req.path,
        method: req.method,
        duration,
        requestId: req.requestId,
      })
    }
    
    // Send to metrics service
    metrics.histogram('request.duration', duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
    })
  })
  
  next()
}
```

---

## 4. Configuration

### Environment Variables
```env
# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DESTINATION=console  # console | file | cloudwatch | datadog
LOG_FILE_PATH=./logs/app.log
LOG_RETENTION_DAYS=30

# Monitoring
ENABLE_METRICS=true
METRICS_ENDPOINT=/metrics
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
DATADOG_APP_KEY=xxx

# Security
ENABLE_SECURITY_MONITORING=true
BRUTE_FORCE_THRESHOLD=5
BRUTE_FORCE_WINDOW_MINUTES=15
```

### Auth Config
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

---

## 5. Dashboard & Reports

### Recommended Dashboards

#### Authentication Dashboard
- Login success/failure rate
- Authentication method distribution
- Daily active users
- New user registrations

#### Security Dashboard
- Failed login attempts
- Brute force incidents
- Suspicious activity
- Rate limit violations

#### Performance Dashboard
- Request latency (p50, p95, p99)
- Error rate
- Database query time
- External API call time

#### Business Dashboard
- User growth
- Tenant activity
- Feature adoption (MFA, OAuth, etc.)
- Geographic distribution

---

## 6. Compliance & Audit

### Audit Log Requirements
- All authentication events must be logged
- Security events must be retained for 1 year
- Logs must be tamper-proof (immutable)
- Access to logs must be restricted and logged

### GDPR Considerations
- User data in logs must be anonymized or pseudonymized
- Users must be able to request their log data
- Logs containing PII must have retention limits

---

## 7. Next Steps

1. **Review & Approve**: Review this plan with the team
2. **Choose Tools**: Select monitoring tools (Datadog, New Relic, etc.)
3. **Implement Phase 1**: Basic logging (Week 1)
4. **Implement Phase 2**: Event tracking (Week 2)
5. **Implement Phase 3**: Security monitoring (Week 3)
6. **Implement Phase 4**: Performance monitoring (Week 4)
7. **Set Up Dashboards**: Create monitoring dashboards
8. **Set Up Alerts**: Configure alerting rules
9. **Documentation**: Update Developer Guide with logging/monitoring info

---

## 8. Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Pino Documentation](https://getpino.io/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Datadog Documentation](https://docs.datadoghq.com/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

---

**Status**: Ready for implementation after Phase 1 completion.
