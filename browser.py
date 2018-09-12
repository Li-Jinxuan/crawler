import platform

import os
from time import sleep

from splinter import Browser


def add_chrome_webdriver():
    print(platform.system())
    working_path = os.getcwd()
    library = 'library'
    path = os.path.join(working_path, library)
    os.environ['PATH'] += '{}{}{}'.format(os.pathsep, path, os.pathsep)
    print(os.environ['PATH'])


def find_website():
    with Browser('chrome', headless=True) as browser:
        # Visit URL
        url = "http://www.baidu.com"
        browser.visit(url)

        input = browser.find_by_css('#kw')
        input.fill('splinter - python acceptance testing for web applications')

        # Find and click the 'search' button
        button = browser.find_by_css('#su')
        # Interact with elements
        button.click()

        if browser.is_text_present('splinter.readthedocs'):
            print("Yes, the official website was found!")
        else:
            print("No, it wasn't found... We need to improve our SEO techniques")


def main():
    add_chrome_webdriver()
    find_website()


if __name__ == '__main__':
    main()
