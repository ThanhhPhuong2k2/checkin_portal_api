FROM node:20-alpine

EXPOSE 5002

WORKDIR /home/app

COPY . .

RUN yarn install
RUN yarn compile

CMD [ "yarn", "serve" ]