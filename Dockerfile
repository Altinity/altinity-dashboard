FROM golang:1.17.3-alpine3.14 as builder

RUN apk update && apk add --no-cache git make npm

WORKDIR /app
COPY . .

RUN make adash

FROM alpine:3.14

COPY --from=builder /app/adash /bin/adash

ENTRYPOINT ["/bin/adash"]
