FROM registry.access.redhat.com/ubi8/ubi-minimal:latest

COPY adash /bin/adash

EXPOSE 8080/tcp

# Override a bunch of Red Hat labels set by ubi8 base image
LABEL summary="Altinity Dashboard helps you manage ClickHouse installations controlled by clickhouse-operator."
LABEL name="altinity-dashboard"
LABEL url="https://github.com/altinity/altinity-dashboard"
LABEL maintainer="Altinity, Inc."
LABEL vendor="Altinity, Inc."
LABEL version=""
LABEL description="Altinity Dashboard helps you manage ClickHouse installations controlled by clickhouse-operator."
LABEL io.k8s.display-name="Altinity Dashboard"
LABEL io.k8s.description="Altinity Dashboard helps you manage ClickHouse installations controlled by clickhouse-operator."

CMD ["/bin/adash"]
