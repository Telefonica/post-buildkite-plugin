FROM node:10.11.0-alpine

WORKDIR /usr/app
COPY package*.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["/usr/app/bin/pipeline"]
