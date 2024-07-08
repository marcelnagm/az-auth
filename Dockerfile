# PRODUCTION STAGE
FROM node:16.15-alpine3.14 as NODE_PROD

WORKDIR /app

ENV NODE_ENV production

COPY ./package.json .

RUN npm install --production

COPY . /app

EXPOSE 8000

CMD [ "node", "." ]
