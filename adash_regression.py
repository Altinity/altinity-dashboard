#  Copyright 2021, Altinity Inc. All Rights Reserved.
#
#  All information contained herein is, and remains the property
#  of Altinity Inc. Any dissemination of this information or
#  reproduction of this material is strictly forbidden unless
#  prior written permission is obtained from Altinity Inc.
from re import S
import subprocess

from argparser import argparser
from sys import flags
from testflows.core import *


@TestModule
@ArgumentParser(argparser)
@Name("adash regression")
def adash_regression(
    self,
    local_webdriver_path,
    browser,
    local,
    global_wait_time,
    latest_adash_build="https://github.com/Altinity/altinity-dashboard/releases",
):
    """Adash regression module"""
    self.context.on_browser = browser
    self.context.local = local
    self.context.global_wait_time = global_wait_time
    self.context.webdriver_path = local_webdriver_path

    with Given("I need to check the Selenium webdriver"):
        attribute(
            "wedriver.version",
            subprocess.check_output(
                [local_webdriver_path, "--version"], encoding="utf-8"
            ).strip(),
        )

    with Given("I need to check the Oracle Virtual box"):
        attribute(
            "virtualbox.version",
            subprocess.check_output(
                ["vboxmanage", "--version"], encoding="utf-8"
            ).strip(),
        )

    Feature(run=load("tests.adash_on_k8s", "adash_on_k8s"))


if main():
    adash_regression()
