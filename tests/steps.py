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
    """Run Altinity dashboard url on Chrome."""
    driver: WebDriver = self.context.driver
    open_altinity_dashboard = "http://0.0.0.0:8080"

    with Given("Adash is running in the VM"):
        with When("start the chrome with Adash url and find `Details` element"):
            time.sleep(10)
            driver.get(open_altinity_dashboard)
            WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located(
                    (
                        SelectBy.XPATH,
                        "/html/body/div[1]/div/main/section/div[1]/div[2]/article/div[1]",
                    )
                )
            )
            

@TestStep(When)
def deploy_cho_install_ch(self):
    """Deploy ClickHouse Operator on Altinity dashboard."""
    driver: WebDriver = self.context.driver
    cho_tab="/html/body/div[1]/div/div/div/nav/ul/li[2]/a"
    add_cho="/html/body/div[1]/div/main/section/div/div[2]/button"
    select_ns="//*[@id='pf-context-selector-toggle-id-0']"
    select_default_ns="/html/body/div[6]/div/div/ul/li[1]/button"
    click_deploy="/html/body/div[5]/div/div/div/footer/button[1]"
    ch_install="/html/body/div[1]/div/div/div/nav/ul/li[3]/a"
    select_template="//*[@id='pf-context-selector-toggle-id-0']"
    select_template_dropdown="/html/body/div[7]/div/div/ul/li[12]/button"
    select_ns_chi="//*[@id='pf-context-selector-toggle-id-0']"
    select_type="//*[@id='pf-context-selector-search-button-id-0']"
    select_ns_search="/html/body/div[8]/div/div/div/div/input"
    select_ns_search_icon="//*[@id='pf-context-selector-search-button-id-0']"
    select_ns_default_chi="/html/body/div[8]/div/div/ul/li[1]/button"
    Create_btn_chi="/html/body/div[5]/div/div/div/footer/div/div[4]/button[1]"

    with Given("Adash is visible in chrome"):
        with When("I click on `ClickHouse Operator` tab in the Adash"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=cho_tab
            )

            cho_tabs = driver.find_element(
                SelectBy.XPATH, cho_tab
            )
            cho_tabs.click()

        with And("I click on `+` button to add ClickHouse Operator"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=add_cho
            )         

            add_chos = driver.find_element(
                SelectBy.XPATH, add_cho
            )
            add_chos.click()

        with And("I click on `Select a Namespace:` drop down"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=select_ns
            )         

            select_nss = driver.find_element(
                SelectBy.XPATH, select_ns
            )
            select_nss.click()

        with And("I click on `default` namespace"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=select_default_ns
            )   

            select_default_nss = driver.find_element(
                SelectBy.XPATH, select_default_ns
            )
            select_default_nss.click()

        with And("I click on `Deploy` button"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=click_deploy
            )   

            click_deploys = driver.find_element(
                SelectBy.XPATH, click_deploy
            )
            click_deploys.click()
            time.sleep(2)

        with And("I click on `ClickHouse Installations` tab"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=ch_install
            )   

            ch_installs = driver.find_element(
                SelectBy.XPATH, ch_install
            )
            ch_installs.click()

        with And("I click on `+` button to add ClickHouse Installations"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=add_cho
            )   

            add_chos = driver.find_element(
                SelectBy.XPATH, add_cho
            )
            add_chos.click()
            time.sleep(2)

        with And("I click on template example dropdown"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=select_template
            )   

            select_templates = driver.find_element(
                SelectBy.XPATH, select_template
            )
            select_templates.click()

        with And("I select a installation template"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=select_template_dropdown
            )   

            select_template_dropdowns = driver.find_element(
                SelectBy.XPATH, select_template_dropdown
            )
            select_template_dropdowns.click()

        with And("I click on `Select a Namespace To Deploy To:` dropdown"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=select_ns_chi
            )   

            select_ns_chis = driver.find_element(
                SelectBy.XPATH, select_ns_chi
            )
            select_ns_chis.click()

            wait_for_element_to_be_clickable(
                select_type=SelectBy.XPATH,
                element=select_ns_search_icon,
            )

            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=select_ns_search
            )   

            select_ns_searchs = driver.find_element(
                SelectBy.XPATH, select_ns_search
            )
            select_ns_searchs.send_keys(Keys.TAB)

            select_ns_search_icons = driver.find_element(
                SelectBy.XPATH, select_ns_search_icon
            )
            select_ns_search_icons.send_keys(Keys.TAB)

            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=select_ns_default_chi
            )   

            select_ns_default_chis = driver.find_element(
                SelectBy.XPATH, select_ns_default_chi
            )
            select_ns_default_chis.send_keys(Keys.ENTER)

        with And("I click `Create` button"):
            wait_for_element_to_be_clickable(
            timeout=40, select_type=SelectBy.XPATH, element=Create_btn_chi
            )               
            Create_btn_chis = driver.find_element(
                SelectBy.XPATH,Create_btn_chi
                ,
            )
            Create_btn_chis.click()


@TestStep(When)
def halt_vagrant(self):
    """Halt the running vagrant VM."""
    with Given("vagrant vm is already running"):
        with When(f"I halt the vm"):
            os.system("vagrant halt")
