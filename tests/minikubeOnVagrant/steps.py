#!/usr/bin/env python3
#  Copyright 2020, Altinity Inc. All Rights Reserved.
#
#  All information contained herein is, and remains the property
#  of Altinity Inc. Any dissemination of this information or
#  reproduction of this material is strictly forbidden unless
#  prior written permission is obtained from Altinity Inc.
import time

from testflows.core import *
from testflows.texts import *
from steps import bash
from steps import open_terminal


@TestStep(Given)
def create_vagrant_with_minikube(self):
    """Check creating Vagrant VM with minikube installed."""
   
    abs_dir_path = os.path.dirname(os.path.abspath(__file__))
    abs_path_to_test_dir = f"{abs_dir_path}/../"
    vagrant_up_command = "vagrant up"
    minikube_start_command = "minikube start"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"
    
    try:

        with By(f"starting the vagrant from folder {abs_path_to_test_dir}/minikubeOnVagrant"):
            os.chdir(abs_path_to_test_dir)
            os.chdir("./minikubeOnVagrant")
            os.system(vagrant_up_command)

        with And("opening VM terminal and setting it to context"):
            self.context.vm_terminal = open_terminal(
                command=["vagrant", "ssh"], timeout=1000
            )

        with And(
            "changing the directory to vagrant default mounted directory",
            description=f"{vagrant_default_mounted_dir_in_vm}",
        ):
            bash(vagrant_default_mounted_dir_in_vm, self.context.vm_terminal)

        with And(
            "starting minikube inside the VM", description=f"{minikube_start_command}"
        ):
            bash(minikube_start_command, self.context.vm_terminal)

        yield

    finally:
        os.chdir(abs_path_to_test_dir)


@TestStep(When)
def start_adash(self):
    """Start Adash in background inside VM."""
    adash_start_command = (
        "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 -notoken &"
    )
    with When(
        "Connect to VM and run the Adash in background",
        description=f"{adash_start_command}",
    ):
        bash(adash_start_command, self.context.vm_terminal)
