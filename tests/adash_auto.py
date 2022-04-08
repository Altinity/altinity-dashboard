#  Copyright 2022, Altinity Inc. All Rights Reserved.
#
#  All information contained herein is, and remains the property
#  of Altinity Inc. Any dissemination of this information or
#  reproduction of this material is strictly forbidden unless
#  prior written permission is obtained from Altinity Inc.
from testflows.core import *
from testflows.connect import SSH


@TestScenario
@Name("Test Altinity Dashboard with Minikube Kubernetes")
def adash_minikube(self):
    """Check Altinity Dashboard with Minikube Kubernetes distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with Minikube and
    test the dashboard url in the host machine's browser
    Step 1: Spring a Vagrant VM with docker, minikube and necessary dependencies 
    Step 2: Download and create a executable Adash binary file
    Step 3: Connect to VM and run the Adash in background
    Step 4: Copy the Adash url with token to a browser in the host machine
    Step 5: Deploy a ClickHouse Operator and install ClickHouse using Adash GUI
    Step 6: Exit and halt the Vagrant Vm
    """
    pass



@TestFeature
def adash_on_k8s(self):
    """Check Altinity Dashboard in different Kubernetes distributions
    """
    for scenario in loads(current_module(), Scenario):
        Scenario(run=scenario, flags=TE)


if main():
    adash_on_k8s()