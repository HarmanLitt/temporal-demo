FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY services ./services
COPY src ./src
COPY tsconfig.server.json ./

# Each Compose service overrides this command with its own npm service script.
CMD ["npm", "run", "service:order-api"]
