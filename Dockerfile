# Stage 1: Build Angular (empreinte mémoire limitée pour petits serveurs CI)
FROM node:20-alpine AS build

WORKDIR /app

# Défaut volontairement bas : un heap Node à 4 Go fait planter les VPS 2–4 Go
ARG BUILD_CONFIGURATION=production
ARG NODE_OPTIONS=--max-old-space-size=1536
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NG_BUILD_MAX_WORKERS=1
ENV npm_config_fund=false
ENV npm_config_audit=false
ENV npm_config_progress=false

COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit

COPY . .

# Un seul worker esbuild/angular → moins de pics RAM
RUN npm run build:${BUILD_CONFIGURATION}

# Nettoyage avant le stage suivant (réduit le poids de la couche build)
RUN rm -rf node_modules .angular

###############################################################

FROM nginx:1.27-alpine

ENV BACKEND_HOST=backend-tontine
ENV BACKEND_PORT=6000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend-tontine/browser /usr/share/nginx/html

RUN rm /docker-entrypoint.d/20-envsubst-on-templates.sh

RUN printf '#!/bin/sh\n\
envsubst "\\$BACKEND_HOST \\$BACKEND_PORT" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf\n' \
> /docker-entrypoint.d/99-envsubst.sh \
&& chmod +x /docker-entrypoint.d/99-envsubst.sh

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
