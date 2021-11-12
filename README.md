This is a preliminary version of the Altinity Dashboard, for viewing status
of ClickHouse instances managed by clickhouse-operator.

Approximate instructions to build this from source:

1. Have a development system with at least make, npm and golang >= 1.16.
2. Clone the repo.
3. `git submodule update --init --recursive` to get Swagger UI.
4. `make adash`

How to use this once built:

* `./adash -kubeconfig <path>` (defaults to `$HOME/.kube/config`)
* Browse to http://localhost:8080
* For the API docs, browse to http://localhost:8080/apidocs

`make ui-devel` may be useful for UI development.
