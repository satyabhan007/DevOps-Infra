# The simplest useful multi-stage: build static assets in Node, serve
# them from an unprivileged nginx. No app runtime in the final image.
#
#   docker build -t demo:site .
#   docker run --rm -p 8080:8080 demo:site
#
# Analogy: print the newspaper on the big press (build stage), then the
# newsstand (nginx) just hands out copies — it does not need the press.

# ---- stage 1: build the assets --------------------------------------------
FROM node:20-alpine AS build
WORKDIR /src
COPY package.json ./
# A real project would `npm ci`; this demo has no deps, so just copy.
COPY . .
RUN mkdir -p /out && cp -r public/* /out/

# ---- stage 2: serve -----------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS serve
COPY --from=build /out /usr/share/nginx/html
EXPOSE 8080
# nginx-unprivileged already runs as uid 101 and listens on 8080.
