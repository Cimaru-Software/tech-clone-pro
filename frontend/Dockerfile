# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
ENV NODE_ENV=development

COPY package.json package-lock.json ./
# package-lock.json is currently out of sync with package.json, so npm ci fails.
# npm install keeps the dev image buildable without modifying the local lockfile.
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
