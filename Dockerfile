FROM registry.access.redhat.com/ubi8/ubi-minimal:latest

COPY adash /bin/adash

EXPOSE 8080/tcp

CMD ["/bin/adash"]
