# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy node_modules and built Next.js app
COPY node_modules ./node_modules
COPY apps/web/.next/standalone ./
COPY apps/web/.next/static ./apps/web/.next/static
COPY apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]