FROM node:10.11.0-alpine

WORKDIR /usr/app
COPY . .
ENV NODE_ENV production
RUN npm install

ENTRYPOINT ["/usr/app/bin/pipeline"]
