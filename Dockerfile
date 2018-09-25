FROM node:10.11.0-alpine

WORKDIR /usr/app
COPY . .
RUN npm ci

ENTRYPOINT ["/usr/app/bin/pipeline"]
