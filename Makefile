NAME := please-protect-console

start:
	@@cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
	@@node .next/standalone/server.js

build:
	@@pnpm run build

run: build start

docker-build:
	@@docker build -t $(NAME) .

docker-run:
	@@docker run --rm --env-file .env -p 3000:3000 $(NAME)

