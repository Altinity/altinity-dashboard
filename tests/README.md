# Altinity Dashboard Regression Tests


## Description

The Altinity Dashboard allows easy deployment and management of ClickHouse in Kubernetes, managed using the Altinity clickhouse-operator.

# Usage

## Running Regression Suite

The following command is used to run regression scripts that uses the Vagrant VM:

```bash
python3 ./adash_regression.py --webdriver "/snap/bin/chromium.chromedriver" --browser "chrome" --local --global_wait_time 30
```

You can execute only one test case using the `--only` option. For example,

python3 ./adash_regression.py --webdriver "/snap/bin/chromium.chromedriver" --browser "chrome" --local --global_wait_time 30 --only "/adash regression/adash on kubernetes/Test Altinity Dashboard with K0s Kubernetes clusters/*"

You can change the output format using the `--output` option. For example,

```bash
python3 ./adash_regression.py --webdriver "/snap/bin/chromium.chromedriver" --browser "chrome" --local --global_wait_time 30 --output classic
```

> A description of other available output formats can be found at https://testflows.com/handbook/#Controlling-Output.

## Test Environment

Test cases are using different Kubernetes distributions such as K0S, K3S, Kind, MicroK8S, and Minikube to run the dashboard. These Kubernetes distributions are installed inside the Vagrant VM and configured to execute the test cases. The Vagrantfile contains the VM's configurations and commands to install all the dependencies.

# Roadmap

Test cases will be updated with new releases of the Altinity Dashboard.
