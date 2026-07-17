# IMS API — production image for Coolify / Docker
FROM node:20-alpine

WORKDIR /app

# bcrypt native build + healthcheck wget
RUN apk add --no-cache python3 make g++ wget

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

USER node

CMD ["node", "src/index.js"]
