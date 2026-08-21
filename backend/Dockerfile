# Backend production image — Gurukrupa Powertech Solutions
# Multi-stage build: compile TypeScript, then run only the compiled output
# with production dependencies. See Deployment_Guide.md §2 for usage.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
