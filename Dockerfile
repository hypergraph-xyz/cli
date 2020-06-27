FROM mhart/alpine-node:12

ARG USER=default

RUN apk upgrade --no-cache -U && \
  apk add --no-cache curl make gcc g++ python linux-headers binutils-gold gnupg libstdc++ libtool autoconf automake

RUN apk --update add fuse fuse-dev git bash util-linux;

RUN set -ex && apk --no-cache add sudo

WORKDIR cli-fuse-test

COPY . .

RUN npm install

RUN echo "Running daemon fuse-setup"
RUN ./node_modules/hyperdrive-daemon/bin/run/run fuse-setup;
# RUN echo "Running daemon status"
# RUN ./node_modules/hyperdrive-daemon/bin/run/run status;

CMD node test/create.js
