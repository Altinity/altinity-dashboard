This is a preliminary version of the Altinity Dashboard, for viewing status
of ClickHouse instances managed by clickhouse-operator.

Approximate instructions to build this from source:

1. Have a development system with at least make, npm and golang >= 1.16.
2. Clone the repo.
3. `git submodule update --init --recursive` to retrieve clickhouse-operator.
4. `make adash` for a prod server or `BUILD_TAGS=dev make adash` for a dev server.

How to use this once built:

* Run `./adash` (see `./adash -help` for additional options)
* Browse to http://localhost:8080

`make ui-devel` will start a filesystem watcher / hot reloader for UI development.
