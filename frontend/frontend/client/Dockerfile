FROM node:22.22.0-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

ARG REACT_APP_API_URL=http://localhost:5000
ARG REACT_APP_SOCKET_URL=http://localhost:5000
ARG REACT_APP_DEFAULT_USER_EMAIL
ARG REACT_APP_CLEANUP_TOKEN

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV REACT_APP_DEFAULT_USER_EMAIL=$REACT_APP_DEFAULT_USER_EMAIL
ENV REACT_APP_CLEANUP_TOKEN=$REACT_APP_CLEANUP_TOKEN

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
	CMD wget -q -O - http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]