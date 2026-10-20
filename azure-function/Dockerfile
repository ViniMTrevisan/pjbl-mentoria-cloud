FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json host.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM --platform=linux/amd64 mcr.microsoft.com/azure-functions/node:4-node20
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    FUNCTIONS_WORKER_RUNTIME=node
COPY --from=build /app /home/site/wwwroot
