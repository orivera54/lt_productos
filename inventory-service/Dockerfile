# Dockerfile - Inventory Service
#
# Autor: Oscar Javier Rivera
# Descripción: Imagen Docker para el microservicio de inventario

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["npm", "start"]
