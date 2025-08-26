#include .env

.PHONY: up

default: up

build:
	docker run \
      --rm \
      -w /usr/src/app \
      -v ./:/usr/src/app \
      node:22 \
      bash -c "npm i && npm run build"

## start	:	Start up containers.
start:
	docker run -d \
      --name pro-feel \
      --rm \
      -p 5000 \
      -w /usr/src/app \
      -v ./:/usr/src/app \
      node:22 \
      sh -c "npm run start" \
      && docker ps | grep "pro-feel"
      #--restart=on-failure \
