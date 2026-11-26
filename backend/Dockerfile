FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
RUN chown -R node:node /app
USER node
ENV NODE_ENV=production
EXPOSE 3101
CMD ["node", "src/index.js"]
