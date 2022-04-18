#  Copyright 2022, Altinity Inc. All Rights Reserved.
#
#  All information contained herein is, and remains the property
#  of Altinity Inc. Any dissemination of this information or
#  reproduction of this material is strictly forbidden unless
#  prior written permission is obtained from Altinity Inc.
import os

from testflows.core import *
from testflows.connect import SSH
from tests.steps import *
from minikubeOnVagrant.steps import *
from microK8SOnVagrant.steps import *


@TestScenario
@Name("Test Altinity Dashboard with Minikube Kubernetes")
def adash_minikube(self):
    """Check Altinity Dashboard with Minikube Kubernetes distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with Minikube and
    test the dashboard url in the host machine's browser
    """
    try:
        with Given("I have Selenium webdriver installed and Vagrant is configured"):
            self.context.driver = webdriver(
                browser=self.context.on_browser,
                local=self.context.local,
                local_webdriver_path=self.context.webdriver_path,
            )

        with When("I start the Vagrant VM with minikube"):
            create_vagrant_with_minikube()

        with When("Connect to VM and run the Adash in background"):
            start_adash()

        with When("Copy the Adash url to a browser in the host machine"):
            run_adash_on_chrome()

        with When("Deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
            deploy_cho_install_ch()

    finally:        
        with Finally("Exit and halt the Vagrant Vm"):
            halt_vagrant()
            os.chdir("../")
        


@TestScenario
@Name("Test Altinity Dashboard with Microk8s Kubernetes")
def adash_microk8s(self):
    """Check Altinity Dashboard with Microk8s distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with Microk8s and
    test the dashboard url in the host machine's browser
    """
    try:
        with Given("I have Selenium webdriver installed and Vagrant is configured"):
            self.context.driver = webdriver(
                browser=self.context.on_browser,
                local=self.context.local,
                local_webdriver_path=self.context.webdriver_path,
            )

        with When("I start the Vagrant VM with Microk8s"):
            create_vagrant_with_microk8s()

        with When("Connect to VM and run the Adash in background"):
            start_adash()

        with When("Copy the Adash url to a browser in the host machine"):
            run_adash_on_chrome()

        with When("Deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
            deploy_cho_install_ch()

    finally:        
        with Finally("Exit and halt the Vagrant Vm"):
            halt_vagrant()
            os.chdir("../")     


@TestFeature
@Name("adash on k8s")
def adash_on_k8s(self):
    """Check Altinity Dashboard in different Kubernetes distributions"""
    for scenario in loads(current_module(), Scenario):
        Scenario(run=scenario, flags=TE)
