#!/usr/bin/env python3
#  Copyright 2020, Altinity Inc. All Rights Reserved.
#
#  All information contained herein is, and remains the property
#  of Altinity Inc. Any dissemination of this information or
#  reproduction of this material is strictly forbidden unless
#  prior written permission is obtained from Altinity Inc.
from testflows.core import *
from testflows.texts import *


@TextStep(Given)
def create_vagrant_file(self, name, content, type="yaml", terminal=None):
    """Create Vagrant file."""
    try:
        bash(f"cat << 'HEREDOC' > {name}\n" + content + "\nHEREDOC", terminal=terminal)
        yield name
    finally:
        with Finally(f"I delete {name}"):
            bash(f"rm -rf {name}", add_to_text=False, terminal=terminal)


def bash(command, terminal=None, *args, **kwargs):
    """Execute command in a terminal."""
    if terminal is None:
        terminal = current().context.terminal

    r = terminal(command, *args, **kwargs)

    return r


@TextStep(Given)
def open_terminal(self, command=["/bin/bash"], timeout=100):
    """Open host terminal."""
    with Shell(command=command) as terminal:
        terminal.timeout = timeout
        terminal("echo 1")
        try:
            yield terminal
        finally:
            with Cleanup("closing terminal"):
                terminal.close()


@TestStep(Then)
def create_vagrant_with_minikube(self):
    """Check creating Vagrant VM with minikube installed"""
    cwd = os.getcwd()
    vagrant_up_command = "vagrant up"
    vagrant_connect_command = "vagrant ssh"
    minikube_start_command = "minikube start"
    adash_start_command = "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 &"
    open_altinity_dashboard = "http://0.0.0.0:8080?token=<ADASH TOKEN>"
    link_to_altinity_dashboard_releases = (
        "https://github.com/Altinity/altinity-dashboard/releases"
    )
    vagrant_default_mounted_dir_in_host = "{path_to_dashboard_repo}/minikubeOnVagrant"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"
    make_executable_command = "chmod 0755 adash"
    server_url = (
        "http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas"
    )
    minikube_command_to_verify_deployment = " kubectl get pods --namespace kube-system"
    with Given("I have vagrant file with necessary configurations"):

        with When(f"I start the vagrant from folder {cwd}/minikubeOnVagrant"):
            os.chdir(cwd)
            os.chdir("./minikubeOnVagrant")
            os.system("vagrant up")
            # folder =  os.path.dirname(os.path.realpath(__file__))

        with And("opening VM terminal and setting it to context"):
            self.context.vm_terminal = open_terminal(
                command=["vagrant", "ssh"], timeout=1000
            )

        with And(
            "change the directory to vagrant default mounted directory",
            description=f"{vagrant_default_mounted_dir_in_vm}",
        ):
            bash(vagrant_default_mounted_dir_in_vm, self.context.vm_terminal)

        with And(
            "start minikube inside the VM", description=f"{minikube_start_command}"
        ):
            bash(minikube_start_command, self.context.vm_terminal)

        with And(
            "start Altinity Dashboard inside the VM with open host and 8081 port  ",
            description=f"{adash_start_command}",
        ):
            bash(adash_start_command, self.context.vm_terminal)
