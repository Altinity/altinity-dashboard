FROM golang:1.17.3-bullseye as builder

RUN apt update
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt install -y git make nodejs

WORKDIR /app
COPY . .

RUN make adash

FROM debian:bullseye

COPY --from=builder /app/adash /bin/adash

ENTRYPOINT ["/bin/adash"]
