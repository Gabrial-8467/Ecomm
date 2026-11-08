# syntax=docker/dockerfile:1.7

# CasaCircuit production image.
# The build stage validates the schema and compiles the Next.js standalone
# server; the runner stage contains only the traced runtime and static assets.

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, so the schema and config must be present.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholders. Real secrets are injected at runtime and validated
# by src/instrumentation.ts when the container starts.
ENV NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    SUPPORT_EMAIL=build@example.invalid \
    SESSION_SECRET=build-only-session-secret-0000000000000000 \
    CSRF_SECRET=build-only-csrf-secret-000000000000000000 \
    OTP_PEPPER=build-only-otp-pepper-0000000000000000000 \
    MFA_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    EMAIL_FROM="CasaCircuit <build@example.invalid>"

RUN npx prisma generate
RUN npm run build

# Target used by one-shot migration jobs and CI. It keeps the Prisma CLI.
FROM builder AS migrator
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
