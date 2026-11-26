FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
ENV NODE_ENV=production
EXPOSE 3101
CMD ["node", "src/index.js"]
