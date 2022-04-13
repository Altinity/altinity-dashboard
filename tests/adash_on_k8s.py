#  Copyright 2022, Altinity Inc. All Rights Reserved.
#
#  All information contained herein is, and remains the property
#  of Altinity Inc. Any dissemination of this information or
#  reproduction of this material is strictly forbidden unless
#  prior written permission is obtained from Altinity Inc.
import os

from testflows.core import *
from testflows.connect import SSH
from tests.steps import webdriver
from minikubeOnVagrant.steps import *


@TestScenario
@Name("Test Altinity Dashboard with Minikube Kubernetes")
def adash_minikube(self):
    """Check Altinity Dashboard with Minikube Kubernetes distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with Minikube and
    test the dashboard url in the host machine's browser
    """
    with Given("I have Selenium webdriver installed and Vagrant is configured"):
        self.context.driver = webdriver(
            browser=self.context.on_browser,
            local=self.context.local,
            local_webdriver_path=self.context.webdriver_path,
        )
        pass
    with Then("I start the Vagrant VM with minikube"):
        create_vagrant_with_minikube()

    # with Then("Connect to VM and run the Adash in background"):
    #     pass

    # with Then("Copy the Adash url with token to a browser in the host machine"):
    #     pass

    # with Then("Deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
    #     pass

    # with Then("Exit and halt the Vagrant Vm"):
    #     pass


@TestFeature
@Name("adash on k8s")
def adash_on_k8s(self):
    """Check Altinity Dashboard in different Kubernetes distributions"""
    for scenario in loads(current_module(), Scenario):
        Scenario(run=scenario, flags=TE)
