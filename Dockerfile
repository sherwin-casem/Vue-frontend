FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG KENDO_UI_LICENSE
RUN npx kendo-ui-licensing activate --key "$KENDO_UI_LICENSE" || echo "License activation failed (non-blocking)"

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
