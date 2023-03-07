FROM node:16.4.2-alpine AS base

WORKDIR /app

COPY package.json .

RUN ls

RUN npm install

COPY . .

FROM base AS prod

WORKDIR /app

COPY --from=base /app .

RUN npm install --global typescript@4.7.4

RUN tsc

CMD [ "npm", "start" ]
