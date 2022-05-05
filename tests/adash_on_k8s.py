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
from KindOnVagrant.steps import *
from K3sOnVagrant.steps import *
from K0sOnVagrant.steps import *
from tests.requirements.requirements import *


@TestScenario
@Requirements(RQ_SRS_001_AltinityDashboard_Minikube("1.0"))
@Name("Test Altinity Dashboard with Minikube Kubernetes clusters")
def adash_minikube(self):
    """Check Altinity Dashboard with Minikube Kubernetes distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with Minikube and
    test the dashboard url in the host machine's browser.
    """
    minikube_stop_command = "minikube stop"

    try:
        with Given("I have Selenium webdriver installed and Vagrant is configured"):
            self.context.driver = webdriver(
                browser=self.context.on_browser,
                local=self.context.local,
                local_webdriver_path=self.context.webdriver_path,
            )

        with And("I start the Vagrant VM with minikube"):
            create_vagrant_with_minikube()

        with And("I connect to VM and run the Adash in background"):
            start_adash()

        with When("I copy the Adash url to a browser in the host machine"):
            run_adash_on_chrome()

        with Then("I deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
            deploy_cho_install_ch()

        with And("I delete the ClickHouse Installations and ClicKHouse Operator using Adash GUI"):
            delete_cho_remove_ch()

    finally:        
        with Finally("exit and halt the Vagrant Vm"):
            bash(minikube_stop_command, self.context.vm_terminal)
            halt_vagrant()
        

@Requirements(RQ_SRS_001_AltinityDashboard_MicroK8s("1.0"))
@TestScenario
@Name("Test Altinity Dashboard with Microk8s Kubernetes clusters")
def adash_microk8s(self):
    """Check Altinity Dashboard with Microk8s k8s distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with Microk8s and
    test the dashboard url in the host machine's browser.
    """
    try:
        with Given("I have Selenium webdriver installed and Vagrant is configured"):
            self.context.driver = webdriver(
                browser=self.context.on_browser,
                local=self.context.local,
                local_webdriver_path=self.context.webdriver_path,
            )

        with And("I start the Vagrant VM with Microk8s"):
            create_vagrant_with_microk8s()

        with And("I connect to VM and run the Adash in background"):
            start_adash()

        with When("I copy the Adash url to a browser in the host machine"):
            run_adash_on_chrome()

        with Then("I deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
            deploy_cho_install_ch()

        with And("I delete the ClickHouse Installations and ClicKHouse Operator using Adash GUI"):
            delete_cho_remove_ch()            

    finally:        
        with Finally("exit and halt the Vagrant Vm"):
            halt_vagrant()


@TestScenario
@Requirements(RQ_SRS_001_AltinityDashboard_Kind("1.0"))
@Name("Test Altinity Dashboard with Kind Kubernetes clusters")
def adash_kind(self):
    """Check Altinity Dashboard with Kind k8s distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with Kind and
    test the dashboard url in the host machine's browser.
    """
    try:
        with Given("I have Selenium webdriver installed and Vagrant is configured"):
            self.context.driver = webdriver(
                browser=self.context.on_browser,
                local=self.context.local,
                local_webdriver_path=self.context.webdriver_path,
            )

        with And("I start the Vagrant VM with Kind"):
            create_vagrant_with_kind()

        with And("I connect to VM and run the Adash in background"):
            start_adash()

        with When("I copy the Adash url to a browser in the host machine"):
            run_adash_on_chrome()

        with Then("I deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
            deploy_cho_install_ch()

        with And("I delete the ClickHouse Installations and ClicKHouse Operator using Adash GUI"):
            delete_cho_remove_ch()  

    finally:        
       with Finally("delete the Kind cluster and halt the Vagrant Vm"):
            delete_kind_cluster()
            halt_vagrant()


@Requirements(RQ_SRS_001_AltinityDashboard_K0S("1.0"))
@TestScenario
@Name("Test Altinity Dashboard with K0s Kubernetes clusters")
def adash_k0s(self):
    """Check Altinity Dashboard with K0s k8s distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with K0s and
    test the dashboard url in the host machine's browser.
    """
    try:
        with Given("I have Selenium webdriver installed and Vagrant is configured"):
            self.context.driver = webdriver(
                browser=self.context.on_browser,
                local=self.context.local,
                local_webdriver_path=self.context.webdriver_path,
            )

        with And("I start the Vagrant VM with k0s"):
            create_vagrant_with_k0s()

        with And("I connect to VM and run the Adash in background"):
            start_adash()

        with When("I copy the Adash url to a browser in the host machine"):
            run_adash_on_chrome()

        with Then("I deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
            deploy_cho_install_ch(timeout=30)

        with And("I delete the ClickHouse Installations and ClicKHouse Operator using Adash GUI"):
            delete_cho_remove_ch(timeout=30)  

    finally:        
        with Finally("exit and halt the Vagrant Vm"):
            halt_vagrant()


@Requirements(RQ_SRS_001_AltinityDashboard_K3S("1.0"))
@TestScenario
@Name("Test Altinity Dashboard with K3s Kubernetes clusters")
def adash_k3s(self):
    """Check Altinity Dashboard with K3s k8s distribution
    by running Altinity Dashboard in a Vagrant VM which is configured with K3s and
    test the dashboard url in the host machine's browser.
    """
    k3s_server_stop_command = "sudo service k3s stop"
    delete_kube_dir = "sudo rm -rf ~/.kube"
    delete_ch_from_default_ns = "sudo kubectl delete -n default deployment clickhouse-operator"

    try:
        with Given("I have Selenium webdriver installed and Vagrant is configured"):
            self.context.driver = webdriver(
                browser=self.context.on_browser,
                local=self.context.local,
                local_webdriver_path=self.context.webdriver_path,
            )

        with And("I start the Vagrant VM with k3s"):
            create_vagrant_with_k3s()

        with And("I connect to VM and run the Adash in background"):
            start_adash()

        with When("I copy the Adash url to a browser in the host machine"):
            run_adash_on_chrome()

        with Then("I deploy a ClickHouse Operator and install ClickHouse using Adash GUI"):
            deploy_cho_install_ch(timeout=45)

    finally:        
        with Finally("exit and halt the Vagrant Vm"):
            bash(delete_ch_from_default_ns, self.context.vm_terminal)
            halt_vagrant()


@TestFeature
@Name("adash on kubernetes")
def adash_on_k8s(self):
    """Check Altinity Dashboard in different Kubernetes distributions"""
    for scenario in loads(current_module(), Scenario):
        Scenario(run=scenario, flags=TE)
