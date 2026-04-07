FROM oven/bun:1.2.19-alpine
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY src ./src

EXPOSE 7788

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD []
