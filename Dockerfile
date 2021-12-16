FROM node:17-alpine3.12
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm install