# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_GATEWAY_URL=http://localhost:8080/api
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
