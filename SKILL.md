---
name: node-typescript-enterprise
description: >
  Production-grade enterprise Node.js + TypeScript application scaffold for both
  frontend (React + Vite) and backend (Express + Prisma + BullMQ). Use this skill
  whenever building enterprise web apps, SaaS platforms, or any full-stack Node/TypeScript
  project requiring SOC2-grade security, RBAC, job queues, multi-tenancy, or Xero/OAuth
  integrations. Triggers on requests for: bulletproof backend structure, secure API
  architecture, production folder layout, SOC2 security implementation, TypeScript MERN
  stack scaffolding, BullMQ workers, audit logging, enterprise React frontend, or any
  request to "production-ready" or "enterprise-grade" Node/TypeScript code.
---

# Node TypeScript Enterprise Skill

This skill produces **production-grade, SOC2-ready** Node.js + TypeScript code for both
backend (Express + Prisma + PostgreSQL + Redis/BullMQ) and frontend (React 19 + Vite + RTK Query).
It enforces security, audit trail, RBAC, idempotency, and testability as non-negotiables.

---

## Core Principles (Never Compromise)

1. **Fail fast on bad config** — Zod-validate ALL env vars at startup; crash if missing
2. **Idempotency everywhere** — Every external write (DB, third-party API) has an idempotency key
3. **Append-only audit log** — Every state change logged; never update/delete audit rows
4. **RBAC enforced at middleware** — Never trust client-sent role; always DB-verify
5. **Secrets never in code** — All secrets from env vars; env vars from Secrets Manager in prod
6. **Structured logging** — Pino with request IDs; no console.log in production paths
7. **Typed everything** — No `any`, no non-null assertions without comment justification
8. **Test at boundaries** — Unit test pure logic; integration test API+DB; mock third-party APIs

---

## Backend Structure

```
src/
├── config/           # Env validation, singletons (prisma, redis, logger)
├── modules/          # Domain modules — each has controller/service/routes/schema/test
├── workers/          # BullMQ consumers (separate process from API)
├── middlewares/      # authenticate, authorize, rateLimiter, errorHandler, auditLogger
├── utils/            # Pure utility functions
└── types/            # Global type augmentations
```

**Key rule:** Controllers are thin (parse req → call service → return res).
Services contain all business logic and call Prisma/external APIs.
Workers call services — not controllers, not HTTP.

---

## Backend Code Templates

### Config: env.ts (Zod-validated, fail-fast)

```typescript
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_PRIVATE_KEY: z.string().min(100), // RS256 PEM
  JWT_PUBLIC_KEY: z.string().min(100),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex
  XERO_CLIENT_ID: z.string(),
  XERO_CLIENT_SECRET: z.string(),
  XERO_REDIRECT_URI: z.string().url(),
  CORS_ORIGIN: z.string(),
  S3_BUCKET: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug']).default('info'),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  process.exit(1) // Crash early — never run with bad config
}

export const env = parsed.data
export type Env = typeof env
```

### Config: logger.ts (Pino structured logger)

```typescript
import pino from 'pino'
import { env } from './env'

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['password', 'token', 'accessToken', 'refreshToken', 'authorization'],
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({ method: req.method, url: req.url, id: req.id }),
  },
  ...(env.NODE_ENV === 'development' && {
    transport: { target: 'pino-pretty' }
  })
})
```

### Middleware: authenticate.ts (JWT RS256)

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AppError } from '../utils/errors'
import { prisma } from '../config/prisma'

export interface AuthenticatedRequest extends Request {
  user: { id: string; companyId: string; role: string; email: string }
}

export const authenticate = async (
  req: Request, res: Response, next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 401, 'Missing or invalid authorization header'))
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as { sub: string; companyId: string }

    // Always DB-verify — token could be for deactivated user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, companyId: true, role: true, email: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return next(new AppError('UNAUTHORIZED', 401, 'User not found or inactive'))
    }

    ;(req as AuthenticatedRequest).user = user
    next()
  } catch (err) {
    return next(new AppError('UNAUTHORIZED', 401, 'Invalid or expired token'))
  }
}
```

### Middleware: authorize.ts (RBAC)

```typescript
import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './authenticate'
import { AppError } from '../utils/errors'

type Role = 'VIEWER' | 'OPERATOR' | 'APPROVER' | 'ADMIN'

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0, OPERATOR: 1, APPROVER: 2, ADMIN: 3
}

export const authorize = (...allowedRoles: Role[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const userRole = req.user.role as Role
    const userLevel = ROLE_HIERARCHY[userRole] ?? -1
    const requiredLevel = Math.min(...allowedRoles.map(r => ROLE_HIERARCHY[r]))

    if (userLevel < requiredLevel) {
      return next(new AppError('FORBIDDEN', 403, 'Insufficient permissions'))
    }
    next()
  }
```

### Middleware: errorHandler.ts (Global error handler)

```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from '../config/logger'
import { AppError } from '../utils/errors'

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      errors: err.flatten().fieldErrors,
      requestId,
    })
  }

  // Prisma unique constraint
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: 'Resource already exists',
      requestId,
    })
  }

  // Known app error
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, 'Application error')
    }
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      requestId,
    })
  }

  // Unknown error — never leak stack trace to client
  logger.error({ err, requestId }, 'Unhandled error')
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  })
}
```

### Utils: errors.ts (AppError hierarchy)

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', 404, `${resource} with id '${id}' not found`)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', 409, message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', 403, message)
  }
}
```

### Utils: idempotency.ts

```typescript
import { createHash } from 'crypto'
import { redis } from '../config/redis'
import { prisma } from '../config/prisma'

const IDEMPOTENCY_TTL = 60 * 60 * 24 // 24 hours in Redis

export const generateIdempotencyKey = (...parts: string[]): string => {
  return createHash('sha256').update(parts.join('|')).digest('hex')
}

export const checkIdempotency = async (key: string): Promise<
  { alreadyProcessed: false } | { alreadyProcessed: true; result: unknown }
> => {
  // Check Redis first (fast path)
  const cached = await redis.get(`idempotency:${key}`)
  if (cached) {
    return { alreadyProcessed: true, result: JSON.parse(cached) }
  }

  // Fallback to DB (Redis may have evicted)
  const dbRecord = await prisma.idempotencyLog.findUnique({ where: { key } })
  if (dbRecord?.status === 'COMPLETED') {
    // Re-populate Redis cache
    await redis.setex(`idempotency:${key}`, IDEMPOTENCY_TTL, 
      JSON.stringify(dbRecord.responseSnapshot))
    return { alreadyProcessed: true, result: dbRecord.responseSnapshot }
  }

  return { alreadyProcessed: false }
}

export const recordIdempotency = async (key: string, result: unknown): Promise<void> => {
  await Promise.all([
    redis.setex(`idempotency:${key}`, IDEMPOTENCY_TTL, JSON.stringify(result)),
    prisma.idempotencyLog.upsert({
      where: { key },
      create: { key, status: 'COMPLETED', responseSnapshot: result as any },
      update: { status: 'COMPLETED', responseSnapshot: result as any }
    })
  ])
}
```

### Utils: dates.ts (Multi-format date parser — critical for Excel)

```typescript
const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
}

export interface ParsedDate {
  iso: string       // YYYY-MM-DD
  year: number
  month: number
  day: number
}

export const parseFlexibleDate = (raw: unknown): ParsedDate | null => {
  if (raw === null || raw === undefined) return null

  // Excel serial number (Windows epoch: 1899-12-30)
  if (typeof raw === 'number' || (typeof raw === 'string' && /^\d+(\.\d+)?$/.test(String(raw).trim()))) {
    const serial = parseFloat(String(raw))
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(epoch.getTime() + serial * 86400000)
    if (!isNaN(date.getTime())) {
      return buildParsedDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
    }
  }

  const s = String(raw).trim()
  if (!s) return null

  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return buildParsedDate(+m[1], +m[2], +m[3])

  // DD/MM/YYYY or MM/DD/YYYY — assume DD/MM/YYYY for accounting
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return buildParsedDate(+m[3], +m[2], +m[1])

  // DD-Mon-YY or DD Mon YYYY (e.g., "28-Sep-24", "28 September 2024")
  m = s.match(/^(\d{1,2})[-\s]+([A-Za-z]{3,})[-\s]+(\d{2,4})$/)
  if (m) {
    const day = +m[1]
    const mon = MONTH_MAP[m[2].slice(0, 3).toLowerCase()]
    const year = +m[3] < 100 ? 2000 + +m[3] : +m[3]
    if (mon) return buildParsedDate(year, mon, day)
  }

  return null
}

const buildParsedDate = (year: number, month: number, day: number): ParsedDate | null => {
  if (!year || !month || !day) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return { iso: `${year}-${pad(month)}-${pad(day)}`, year, month, day }
}

export const xeroDateTimeFilter = (d: ParsedDate) =>
  `DateTime(${d.year},${d.month},${d.day})`
```

### Audit Service (Append-only)

```typescript
import { prisma } from '../config/prisma'

interface AuditEntry {
  companyId: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  beforeState?: unknown
  afterState?: unknown
  xeroRequest?: unknown
  xeroResponse?: unknown
  ipAddress?: string
  userAgent?: string
}

// Never throws — audit failure must not break the main operation
export const writeAuditLog = async (entry: AuditEntry): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: entry.companyId,
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        beforeState: entry.beforeState as any,
        afterState: entry.afterState as any,
        xeroRequest: entry.xeroRequest as any,
        xeroResponse: entry.xeroResponse as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      }
    })
  } catch (err) {
    // Log but never rethrow — audit failure is not a blocker
    logger.error({ err, entry }, 'Failed to write audit log')
  }
}
```

### BullMQ Worker (Job handler pattern)

```typescript
import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis'
import { logger } from '../config/logger'
import { handleInvoiceReversal } from './handlers/invoiceReversal.handler'
import { handleOverpaymentAllocation } from './handlers/overpaymentAllocation.handler'

const JOB_QUEUE = 'automation-jobs'

export const startWorker = () => {
  const worker = new Worker(
    JOB_QUEUE,
    async (job: Job) => {
      const log = logger.child({ jobId: job.data.jobId, type: job.data.type })
      log.info('Worker processing job')

      switch (job.data.type) {
        case 'INVOICE_REVERSAL':
          return handleInvoiceReversal(job.data.jobId, log)
        case 'OVERPAYMENT_ALLOCATION':
          return handleOverpaymentAllocation(job.data.jobId, log)
        default:
          throw new Error(`Unknown job type: ${job.data.type}`)
      }
    },
    {
      connection: redis,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 }, // Max 10 Xero calls/sec
    }
  )

  worker.on('completed', (job) => logger.info({ jobId: job.data.jobId }, 'Job completed'))
  worker.on('failed', (job, err) => logger.error({ jobId: job?.data.jobId, err }, 'Job failed'))

  return worker
}
```

### app.ts (Hardened Express setup)

```typescript
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { requestId } from './middlewares/requestId'
import { errorHandler } from './middlewares/errorHandler'
import { env } from './config/env'

export const createApp = () => {
  const app = express()

  // Security headers first
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }))

  app.use(cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }))

  app.use(requestId()) // Attach X-Request-ID
  app.use(express.json({ limit: '1mb' })) // Cap request body size

  // Global rate limit
  app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }))

  // Auth routes get stricter limit
  app.use('/api/v1/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
  }))

  // Routes
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/jobs', authenticate, jobRoutes)
  app.use('/api/v1/xero', authenticate, xeroRoutes)
  app.use('/api/v1/excel', authenticate, excelRoutes)
  app.use('/api/v1/audit', authenticate, authorize('ADMIN'), auditRoutes)

  // Health check (no auth — for load balancer)
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

  // Global error handler — always last
  app.use(errorHandler)

  return app
}
```

---

## Frontend Structure

```
src/
├── components/ui/      # shadcn/ui — never modify these directly
├── components/         # App-specific components (compose from ui/)
├── pages/              # Route-level components (minimal logic)
├── store/              # Redux Toolkit + RTK Query
│   ├── api/            # RTK Query API slices (one per domain)
│   └── slices/         # Local UI state slices
├── hooks/              # Custom hooks (wrap RTK Query, side effects)
├── lib/utils.ts        # cn() + pure helpers
└── types/api.ts        # Shared response types (match backend exactly)
```

**Key rule:** Pages are wired. Components are display. Hooks are logic.
Never fetch data in a component — always in a hook or RTK Query.

---

## Frontend Code Templates

### store/api/baseApi.ts (RTK Query with auth + refresh)

```typescript
import { createApi, fetchBaseQuery, BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { RootState } from '../index'
import { logout, setTokens } from '../slices/authSlice'

const BASE_URL = import.meta.env.VITE_API_URL

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include', // Send httpOnly refresh token cookie
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

// Refresh token on 401
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions)
    if (refreshResult.data) {
      api.dispatch(setTokens(refreshResult.data as any))
      result = await baseQuery(args, api, extraOptions)
    } else {
      api.dispatch(logout())
    }
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Job', 'Company', 'Invoice', 'AuditLog'],
  endpoints: () => ({}),
})
```

### store/api/jobsApi.ts

```typescript
import { baseApi } from './baseApi'

export interface Job {
  id: string
  type: 'INVOICE_REVERSAL' | 'OVERPAYMENT_ALLOCATION'
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
  totalCount: number
  processedCount: number
  skippedCount: number
  failedCount: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listJobs: build.query<{ data: Job[]; total: number }, { page?: number; status?: string }>({
      query: (params) => ({ url: '/jobs', params }),
      providesTags: ['Job'],
    }),
    getJob: build.query<{ data: Job }, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Job', id }],
    }),
    approveJob: build.mutation<void, string>({
      query: (id) => ({ url: `/jobs/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_res, _err, id) => [{ type: 'Job', id }],
    }),
  }),
})

export const { useListJobsQuery, useGetJobQuery, useApproveJobMutation } = jobsApi
```

### hooks/useJobPolling.ts

```typescript
import { useEffect } from 'react'
import { useGetJobQuery } from '../store/api/jobsApi'

export const useJobPolling = (jobId: string, enabled: boolean) => {
  const result = useGetJobQuery(jobId, {
    pollingInterval: enabled ? 3000 : 0,
    skip: !jobId,
  })

  // Stop polling when job is no longer running
  const isRunning = result.data?.data.status === 'RUNNING'

  return {
    ...result,
    isPolling: enabled && isRunning,
  }
}
```

---

## Security Checklist (Run Before Every Deploy)

```
Authentication:
  [ ] JWT uses RS256 (not HS256)
  [ ] Access token TTL ≤ 15 minutes
  [ ] Refresh token in httpOnly Secure SameSite=Strict cookie
  [ ] All refresh tokens stored in Redis with TTL
  [ ] Logout invalidates refresh token in Redis

Authorization:
  [ ] Every protected route has authenticate + authorize middleware
  [ ] No route trusts client-sent role or companyId
  [ ] Four-eyes: job creator cannot approve own job
  [ ] DB query always scopes to req.user.companyId

Input:
  [ ] Every request body validated with Zod schema
  [ ] File uploads: type whitelist, size limit, virus scan
  [ ] No raw SQL — Prisma parameterized queries only
  [ ] xss-clean middleware applied

Output:
  [ ] Error messages never leak stack traces or internal IDs
  [ ] No PII or amounts in log messages (use IDs)
  [ ] Helmet.js headers applied on all responses

Secrets:
  [ ] Zero secrets in source code
  [ ] .env.example has placeholders, .env is in .gitignore
  [ ] Production secrets in AWS Secrets Manager

Audit:
  [ ] Every mutating API call writes audit_log entry
  [ ] Audit log is append-only (no UPDATE/DELETE)
  [ ] Xero API request + response stored in audit_log
```

---

## Package.json Essentials

### Backend

```json
{
  "dependencies": {
    "express": "^4.18",
    "@prisma/client": "^5",
    "bullmq": "^5",
    "ioredis": "^5",
    "jsonwebtoken": "^9",
    "bcryptjs": "^2.4",
    "zod": "^3",
    "pino": "^8",
    "helmet": "^7",
    "cors": "^2",
    "express-rate-limit": "^7",
    "xero-node": "^6",
    "xlsx": "^0.18",
    "multer": "^1.4",
    "uuid": "^9",
    "speakeasy": "^2.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/express": "^4",
    "@types/node": "^20",
    "prisma": "^5",
    "jest": "^29",
    "@testcontainers/postgresql": "^10",
    "nock": "^13",
    "supertest": "^6",
    "pino-pretty": "^10",
    "eslint": "^8",
    "@typescript-eslint/eslint-plugin": "^6"
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "@reduxjs/toolkit": "^2",
    "react-redux": "^9",
    "react-hook-form": "^7",
    "zod": "^3",
    "@hookform/resolvers": "^3",
    "lucide-react": "^0.400",
    "recharts": "^2",
    "@tanstack/react-table": "^8",
    "react-dropzone": "^14",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^8",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "date-fns": "^3"
  },
  "devDependencies": {
    "vite": "^7",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10",
    "playwright": "^1.40"
  }
}
```

---

## Dockerfile (Backend, production-hardened)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Runtime stage — minimal attack surface
FROM node:20-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
USER appuser  # Never run as root
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

---

## GitHub Actions CI (ci.yml)

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: reconix_test }
        options: --health-cmd pg_isready
      redis:
        image: redis:7-alpine
        options: --health-cmd "redis-cli ping"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run db:generate
      - run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/reconix_test
          REDIS_URL: redis://localhost:6379
      - run: npm run build
      - name: Coverage gate
        run: |
          COVERAGE=$(node -e "const r=require('./coverage/coverage-summary.json');console.log(r.total.lines.pct)")
          if (( $(echo "$COVERAGE < 85" | bc -l) )); then echo "Coverage below 85%"; exit 1; fi
```
