# Altinity Dashboard

This is a preliminary version of the Altinity Dashboard.  It is used for viewing and managing Kubernetes-based ClickHouse installations controlled by [clickhouse-operator](https://github.com/altinity/clickhouse-operator).

### Running from GitHub builds

There are no stable releases of this yet.  The current development build is available as a GitHub Actions artifact.  To use this:

* Go to [Actions](https://github.com/Altinity/altinity-dashboard/actions).
* Click on a recent workflow run where the build succeeded (ie, has a green checkmark).
* Download the Altinity Dashboard artifact from the bottom of the page.
* Extract the `adash` file from the downloaded zip file.
* Make it executable with `chmod a+x adash`.
* Run it with `./adash`.

By default, adash will try to connect to the first Kubernetes instance defined in your `~/.kube/config` file.  You can provide a different kubeconfig, or use in-cluster authentication, using command-line parameters.  For more information about the CLI, see `adash --help`.

### Building from source

* Install the following on your development system:
  * [**Go**](https://golang.org/doc/install) 1.16 or higher
  * [**Node.js**](https://nodejs.org/en/download/) v16 or higher, including npm 7.24 or higher
  * **GNU Make** version 4.3 or higher (`yum/dnf/apt install make`)
* Clone the repo (`git clone git@github.com:altinity/altinity-dashboard`).
* Initialize submodules (`git submodule update --init --recursive`).
* Run `make`.

If you are doing development work, it is recommended to install pre-commit hooks so that linters are run before commit.  To set this up:

* Install [golangci-lint](https://github.com/golangci/golangci-lint#readme).
* From the repo root, run `npm --prefix ./ui run install-git-hooks`.
* Run `make lint` to check that everything is working.

### Setting up a development environment

Back-end development:

* Set up your IDE to run `make ui` before compiling, so that the most recent UI gets embedded into the Go binary.  If nothing in the UI has changed, `make ui` will not re-run the build unnecessarily.
* Run the app in the debugger with `adash -devmode`.  This will add a tab with [Swagger UI](https://swagger.io/tools/swagger-ui/) that lets you exercise REST endpoints even if there isn't a UI for them yet.

Front-end development:

* `make ui-devel` will start a filesystem watcher / hot reloader for UI development.

