# Debian-based image required: @temporalio/core-bridge ships a glibc native
# module that cannot load on Alpine (musl).
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY services ./services
COPY src ./src
COPY tsconfig.server.json ./

# Each Compose service overrides this command with its own npm service script.
CMD ["npm", "run", "service:order-api"]
