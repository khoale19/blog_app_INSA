# # ---------- Build (needs devDependencies like vite) ----------
# FROM node:22-alpine AS builder
# WORKDIR /app

# # Copy lockfiles first for cached installs
# COPY package*.json ./

# # Force include dev deps so vite exists even if NODE_ENV=production is set
# RUN npm ci --include=dev

# # Now bring in the source and build
# COPY . .
# RUN npm run build

# # ---------- Runtime (still Node 22, static serve) ----------
# FROM node:22-alpine AS runner
# WORKDIR /app
# RUN npm i -g serve
# COPY --from=builder /app/dist ./dist
# EXPOSE 3000
# CMD ["serve", "-s", "dist", "-l", "3000"]

# ---------- Build (needs devDependencies like vite) ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Copy lockfiles first for cached installs
COPY package*.json ./

# Force include dev deps so vite exists even if NODE_ENV=production is set
RUN npm ci --include=dev

# Now bring in the source and build
COPY . .
RUN npm run build

# ---------- Runtime (still Node 22, static serve) ----------
FROM node:22-alpine AS runner
WORKDIR /app
RUN npm i -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]