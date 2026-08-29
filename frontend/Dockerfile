FROM node:22-alpine AS dependencies
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS test
COPY . .
CMD ["npm", "test"]

FROM dependencies AS build
COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist-app /usr/share/nginx/html
EXPOSE 80
