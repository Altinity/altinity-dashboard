# Altinity Dashboard

This is a preliminary version of the Altinity Dashboard.  It is used for viewing and managing Kubernetes-based ClickHouse installations controlled by [clickhouse-operator](https://github.com/altinity/clickhouse-operator).  It looks like this:

![image](https://user-images.githubusercontent.com/2052848/146246541-4073218c-92be-4ccb-8a4d-b5bbc7f9a309.png)

### What is this?

The Altinity Dashboard allows easy deployment and management of ClickHouse in Kubernetes, managed using the Altinity clickhouse-operator.  Using the dashboard, you can:

* Deploy clickhouse-operator to your Kubernetes cluster.
* Upgrade clickhouse-operator.
* Remove clickhouse-operator.

* Deploy a ClickHouse Installation from a YAML specification (examples are provided), including the ability to define the cluster layout, storage, users and other operational parameters.
* Modify existing ClickHouse Installations, even if they were not created by the Dashboard (as long as they are managed by clickhouse-operator).

* View containers and storage used by ClickHouse Installations, and their status.

### Production Readiness

Current builds of Altinity Dashboard should be considered pre-release, and are not ready for production deployment.  We are using an upstream-first open source development model, so you can see and run the code, but it is not yet a stable release.

### How to Use

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

* Run `docker pull ghcr.io/altinity/altinity-dashboard:latest` to get the latest build of the container.
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

### Talk to Us

If you have questions or want to chat, [join the altinitydb Slack](https://join.slack.com/t/altinitydbworkspace/shared_invite/zt-w6mpotc1-fTz9oYp0VM719DNye9UvrQ) and talk to us in the `#kubernetes` channel.

