FROM node:11-alpine
# git is required by the npm install process.
RUN apk --no-cache add git
WORKDIR /usr/src/app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "run", "start" ]
