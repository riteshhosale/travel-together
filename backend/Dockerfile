FROM node:22.22.0-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
	CMD wget -q -O - http://127.0.0.1:5000/api/ready || exit 1

CMD ["npm", "start"]