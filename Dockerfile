# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

# Install all dependencies (npm workspaces)
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

# Copy source
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY client/ client/
COPY server/ server/
COPY data/ data/

# Build client static files
RUN npx vite build --config client/vite.config.ts client/

# Build server JS
RUN npx tsc --project server/tsconfig.json

# ---- Stage 2: Runtime ----
FROM node:20-alpine

RUN apk add --no-cache nginx && mkdir -p /run/nginx

WORKDIR /app/server

# Install server runtime dep directly (avoids workspace ref issues)
RUN echo '{"name":"server","type":"module","private":true}' > package.json \
    && npm install ws@8

# Compiled server JS
COPY --from=build /app/server/dist/ ./dist/

# Client static files → nginx
COPY --from=build /app/client/dist/ /usr/share/nginx/html/

# Nginx config + entrypoint
WORKDIR /app
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
