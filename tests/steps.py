#!/usr/bin/env python3
#  Copyright 2020, Altinity Inc. All Rights Reserved.
#
#  All information contained herein is, and remains the property
#  of Altinity Inc. Any dissemination of this information or
#  reproduction of this material is strictly forbidden unless
#  prior written permission is obtained from Altinity Inc.
import uuid
import time
import os

from selenium.webdriver import ActionChains
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.select import Select
from selenium.webdriver.support.wait import WebDriverWait
from selenium import webdriver as selenium_webdriver
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.by import By as SelectBy
from selenium.webdriver.common.keys import Keys


from testflows.core import *
from testflows.asserts import error
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
def webdriver(
    self,
    browser="chrome",
    selenium_hub_url="http://127.0.0.1:4444/wd/hub",
    timeout=300,
    local=None,
    local_webdriver_path=None,
):
    """Create webdriver instance."""
    driver = None
    start_time = time.time()
    try_number = 0

    try:
        with Given("I create new webdriver instance"):
            if local:
                if browser == "chrome":
                    default_download_directory = (
                        str(os.path.dirname(os.path.abspath(__file__))) + "/download"
                    )
                    prefs = {"download.default_directory": default_download_directory}
                    chrome_options = selenium_webdriver.ChromeOptions()
                    chrome_options.add_argument("--incognito")
                    chrome_options.add_argument("disable-infobars")
                    chrome_options.add_argument("start-maximized")
                    chrome_options.add_experimental_option("prefs", prefs)
                    driver = selenium_webdriver.Chrome(
                        options=chrome_options, executable_path=local_webdriver_path
                    )
                else:
                    fail("only support chrome")
            else:
                while True:
                    try:
                        driver = selenium_webdriver.Remote(
                            command_executor=selenium_hub_url,
                            desired_capabilities={
                                "browserName": browser,
                                "javascriptEnabled": True,
                            },
                        )

                        break
                    except Exception:
                        now = time.time()
                        if now - start_time >= timeout:
                            raise
                        time.sleep(1)
                    try_number += 1

        with And(
            "I set implicit wait time",
            description=f"{self.context.global_wait_time} sec",
        ):
            driver.implicit_wait = self.context.global_wait_time
            driver.implicitly_wait(self.context.global_wait_time)

        yield driver

    finally:
        with Finally("close webdriver"):
            driver.close()


@TestStep(Given)
def alert(self, message, sleep=0.25):
    """Create alert popup in the browser window."""
    driver: WebDriver = self.context.driver

    driver.execute_script(f'alert("{message}");')
    time.sleep(sleep)
    driver.switch_to.alert.accept()


@TestStep(Given)
def wait_for_element_to_be_clickable(
    self, timeout=None, poll_frequency=None, select_type=None, element=None
):
    """An Expectation for checking an element is visible and enabled such that
    you can click it.
    select_type - option that follows after SelectBy. (Examples: CSS, ID, XPATH, NAME)
    element - locator in string format(Example: "organizationId").
    """
    driver = self.context.driver
    if timeout is None:
        timeout = 30
    if poll_frequency is None:
        poll_frequency = 1

    wait = WebDriverWait(driver, timeout, poll_frequency)
    wait.until(EC.element_to_be_clickable((select_type, element)))


@TestStep(When)
def run_adash_on_chrome(self):
    """Run Altinity dashboard url on Chrome"""
    driver: WebDriver = self.context.driver
    open_altinity_dashboard = "http://0.0.0.0:8080"

    with Given("Adash is running in the VM"):
        with When("start the chrome with Adash url and find `Details` element"):
            driver.get(open_altinity_dashboard)
            WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located(
                    (
                        SelectBy.XPATH,
                        "/html/body/div[1]/div/main/section/div[1]/div[2]/article/div[1]",
                    )
                )
            )
            time.sleep(0.5)


@TestStep(When)
def delete_chi_and_cho(self):
    """Delete created ClickHouse Installation and ClickHouse Operator"""
    driver: WebDriver = self.context.driver

    with Given("ClickHouse Installation and ClickHouse Operator already created"):
        with When("I click on ClickHouse Installations running instance"):
            chi_instance = driver.find_element(
                SelectBy.XPATH, "//*[@id='pf-dropdown-toggle-id-312']"
            )
            chi_instance.click()
            time.sleep(0.5)

        with And("I select `Delete` option"):
            chi_instance_del = driver.find_element(
                SelectBy.XPATH,
                "/html/body/div[1]/div/main/section/table/tbody/tr[1]/td[7]/div/ul/li[2]/button",
            )
            chi_instance_del.click()
            time.sleep(0.5)

        with And("I click on `ClickHouse Operator` tab"):
            cho_tab = driver.find_element(
                SelectBy.XPATH, "/html/body/div[1]/div/div/div/nav/ul/li[2]/a"
            )
            cho_tab.click()
            time.sleep(0.5)

        with And("I click on ClickHouse Operator running instance"):
            cho_instance = driver.find_element(
                SelectBy.XPATH, "//*[@id='pf-dropdown-toggle-id-386']"
            )
            cho_instance.click()
            time.sleep(0.5)

        with And("I select `Delete` option"):
            cho_instance_del = driver.find_element(
                SelectBy.XPATH,
                "/html/body/div[1]/div/main/section/table/tbody/tr[1]/td[6]/div/ul/li[2]/button",
            )
            cho_instance_del.click()
            time.sleep(0.5)


@TestStep(When)
def deploy_cho_install_ch(self):
    """Deploy ClickHouse Operator on Altinity dashboard"""
    driver: WebDriver = self.context.driver

    with Given("Adash is visible in chrome"):
        with When("I click on `ClickHouse Operator` tab in the Adash"):
            cho_tab = driver.find_element(
                SelectBy.XPATH, "/html/body/div[1]/div/div/div/nav/ul/li[2]/a"
            )
            cho_tab.click()
            time.sleep(0.5)

        with And("I click on `+` button to add ClickHouse Operator"):
            add_cho = driver.find_element(
                SelectBy.XPATH, "/html/body/div[1]/div/main/section/div/div[2]/button"
            )
            add_cho.click()
            time.sleep(0.5)

        with And("I click on `Select a Namespace:` drop down"):
            select_ns = driver.find_element(
                SelectBy.XPATH, "//*[@id='pf-context-selector-toggle-id-0']"
            )
            select_ns.click()
            time.sleep(0.5)

        with And("I click on `default` namespace"):
            select_default_ns = driver.find_element(
                SelectBy.XPATH, "/html/body/div[6]/div/div/ul/li[1]/button"
            )
            select_default_ns.click()
            time.sleep(0.5)

        with And("I click on `Deploy` button"):
            click_deploy = driver.find_element(
                SelectBy.XPATH, "/html/body/div[5]/div/div/div/footer/button[1]"
            )
            click_deploy.click()
            time.sleep(0.5)

        with And("I click on `ClickHouse Installations` tab"):
            ch_install = driver.find_element(
                SelectBy.XPATH, "/html/body/div[1]/div/div/div/nav/ul/li[3]/a"
            )
            ch_install.click()
            time.sleep(0.5)

        with And("I click on `ClickHouse Installations` tab"):
            ch_install = driver.find_element(
                SelectBy.XPATH, "/html/body/div[1]/div/div/div/nav/ul/li[3]/a"
            )
            ch_install.click()
            time.sleep(0.5)

        with And("I click on `+` button to add ClickHouse Installations"):
            add_cho = driver.find_element(
                SelectBy.XPATH, "/html/body/div[1]/div/main/section/div/div[2]/button"
            )
            add_cho.click()
            time.sleep(0.5)

        with And("I click on template example dropdown"):
            select_template = driver.find_element(
                SelectBy.XPATH, "//*[@id='pf-context-selector-toggle-id-0']"
            )
            select_template.click()
            time.sleep(0.5)

        with And("I select a installation template"):
            select_template = driver.find_element(
                SelectBy.XPATH, "/html/body/div[7]/div/div/ul/li[12]/button"
            )
            select_template.click()
            time.sleep(0.5)

        with And("I click on `Select a Namespace To Deploy To:` dropdown"):
            select_ns = driver.find_element(
                SelectBy.XPATH, "//*[@id='pf-context-selector-toggle-id-0']"
            )
            select_ns.click()
            time.sleep(1)

            wait_for_element_to_be_clickable(
                select_type=SelectBy.XPATH,
                element="//*[@id='pf-context-selector-search-button-id-0']",
            )
            select_ns_search = driver.find_element(
                SelectBy.XPATH, "/html/body/div[8]/div/div/div/div/input"
            )
            select_ns_search.send_keys(Keys.TAB)
            time.sleep(0.5)
            select_ns_search_icon = driver.find_element(
                SelectBy.XPATH, "//*[@id='pf-context-selector-search-button-id-0']"
            )
            select_ns_search_icon.send_keys(Keys.TAB)
            time.sleep(0.5)
            select_ns_default = driver.find_element(
                SelectBy.XPATH, "/html/body/div[8]/div/div/ul/li[1]/button"
            )
            select_ns_default.send_keys(Keys.ENTER)
            time.sleep(0.5)

        with And("I click `Create` button"):
            Create_btn = driver.find_element(
                SelectBy.XPATH,
                "/html/body/div[5]/div/div/div/footer/div/div[4]/button[1]",
            )
            Create_btn.click()
            time.sleep(0.5)


@TestStep(When)
def halt_vagrant(self):
    """Halt the running vagrant VM"""
    with Given("vagrant vm is already running"):
        with When(f"I halt the vm"):
            os.system("vagrant halt")
