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


from testflows.core import *
from testflows.asserts import error


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
