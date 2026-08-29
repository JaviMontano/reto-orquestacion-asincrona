FROM node:22-alpine
RUN apk add --no-cache chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /tests
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npm", "test"]
