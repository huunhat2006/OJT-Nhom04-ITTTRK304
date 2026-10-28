# Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
# ============================================================
# Dockerfile — Frontend (React + Vite / Node 20)
# Multi-stage build: builder → nginx runtime
# ============================================================

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (cache layer)
COPY package.json package-lock.json ./

# Install dependencies (ci = clean install, respects lock file)
RUN npm ci

# Copy source files
COPY . .

# Build for production
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config (SPA routing + gzip + security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
