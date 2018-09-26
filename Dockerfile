FROM node:10.11.0-alpine

WORKDIR /usr/app
COPY . .
RUN npm install --production

ENTRYPOINT ["/usr/app/bin/pipeline"]
