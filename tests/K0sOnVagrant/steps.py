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


@TestStep(Given)
def create_vagrant_with_k0s(self):
    """Check creating Vagrant VM with K0s installed."""
    cwd = os.getcwd()
    vagrant_up_command = "vagrant up"
    get_k0s_status_command = "sudo k0s status"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"

    try:

        with By(f"starting the vagrant from folder {cwd}/K0sOnVagrant"):
            os.chdir(cwd)
            os.chdir("./K0sOnVagrant")
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
            "checking k0s status in the VM", description=f"{get_k0s_status_command}"
        ):
            bash(get_k0s_status_command, self.context.vm_terminal)

        yield
        
    finally:
        os.chdir(cwd)

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
