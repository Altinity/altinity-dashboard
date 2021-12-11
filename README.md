# Altinity Dashboard

This is a preliminary version of the Altinity Dashboard.  It is used for viewing and managing Kubernetes-based ClickHouse installations controlled by [clickhouse-operator](https://github.com/altinity/clickhouse-operator).

### How To Use

* First, make sure you have a valid kubeconfig pointing to the Kubernetes cluster you want to work with.

* Linux / Mac:
  * Download the appropriate file for your platform from https://github.com/Altinity/altinity-dashboard/releases.
  * `chmod a+x adash-linux-*`
  * `./adash-linux-* --openbrowser`

* Windows:
  * Download and double-click on the Windows EXE file from https://github.com/Altinity/altinity-dashboard/releases.
  * A command prompt window will open and will show a URL.
  * Copy and paste the URL into a web browser.
  * Windows SmartScreen Filter may warn that the EXE file is rarely downloaded.  You can ignore this.

### Running the container image from the GitHub Container Registry

Container images are available on the GitHub Container Registry.  To use this:

* Create a GitHub Personal Access Token with at least read:packages access.
* Run `docker login ghcr.io` and log in using your username and PAT.
* Run `docker pull ghcr.io/altinity/altinity-dashboard:latest` to get the latest development build of the container.
* Run `docker run -it --rm ghcr.io/altinity/altinity-dashboard:latest adash --help`.  If everything is working, you should see command-line help.
* If you run this container inside Kubernetes, it should perform in-cluster auth.
* To run it outside Kubernetes, you will need to volume mount a kubeconfig file and use `-kubeconfig` to point to it.

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

