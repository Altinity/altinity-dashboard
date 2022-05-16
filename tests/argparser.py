import os

from numpy.f2py.crackfortran import requiredpattern
from testflows.core import Secret


def argparser(parser):
    """Default argument parser for adash tests."""
    parser.add_argument(
        "--webdriver",
        type=str,
        metavar="path",
        dest="local_webdriver_path",
        help=(
            "custom path to the locally installed driver, default: '/snap/bin/chromium.chromedriver'. "
            "On Ubuntu you should use '/snap/bin/chromium.chromedriver' or just 'chromium.chromedriver'. "
            "For example: './regression --local --webdriver chromium.chromedriver'."
        ),
        default="/snap/bin/chromium.chromedriver",
    )

    parser.add_argument(
        "--browser",
        metavar="name",
        type=str,
        help="browser to use for testing, default: chrome",
        default="chrome",
    )

    parser.add_argument(
        "--local",
        action="store_true",
        help="run tests in local browser through locally installed driver, default: False",
        default=False,
    )

    parser.add_argument(
        "-g",
        "--global_wait_time",
        type=str,
        help="global implicit wait",
        metavar="global_wait_time",
        default="30",
    )
