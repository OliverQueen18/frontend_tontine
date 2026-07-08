# Stage 1: Build Angular app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BUILD_CONFIGURATION=docker
RUN npm run build:${BUILD_CONFIGURATION}

###############################################################

FROM nginx:1.27-alpine

ENV BACKEND_HOST=backend-pieml
ENV BACKEND_PORT=7000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/pieml-frontend/browser /usr/share/nginx/html

RUN rm /docker-entrypoint.d/20-envsubst-on-templates.sh

RUN printf '#!/bin/sh\n\
envsubst "\\$BACKEND_HOST \\$BACKEND_PORT" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf\n' \
> /docker-entrypoint.d/99-envsubst.sh \
&& chmod +x /docker-entrypoint.d/99-envsubst.sh

EXPOSE 80

CMD ["nginx","-g","daemon off;"]