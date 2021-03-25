import { browser, element, by, ExpectedConditions } from 'protractor';

export class Utils {
  navigateToPath(path: string): Promise<unknown> {
    return browser.get(`http://${process.env.E2E_TEST_ROUTE}/${path}`) as Promise<unknown>;
  }
  getUrlPath() {
    return browser.getCurrentUrl();
  }

  getById(id: string) {
    return element(by.css(`#${id}`));
  }

  getByCSS(id: string) {
    return element(by.css(`${id}`));
  }

  getBtnByText(btnText: string) {
    return element(by.buttonText(btnText));
  }

  getByTagName(tagName: string) {
    return element(by.tagName(tagName));
  }

  waitForAng() {
    return browser.waitForAngular();
  }

  waitForId(id: string) {
    return browser.wait(ExpectedConditions.visibilityOf(this.getById(`${id}`)), 10000);
  }

  waitForSelector(selector: string) {
    return browser.wait(ExpectedConditions.visibilityOf(this.getByCSS(`${selector}`)), 20000);
  }

  async login(): Promise<unknown> {
    // TODO: implement keycloak register
    await this.navigateToPath('');

    // Wait for the DOM
    await this.waitForSelector('.ld-sec__one-left');

    // Get button by ID then hit click
    await this.getBtnByText("login").click();

    // Wait for the DOM
    // await this.waitForId('kc-form-options > div > span > a');

    // Get button by ID then hit click
    // await this.getById('kc-form-options > div > span > a').click();

    // Wait for the DOM
    await this.waitForSelector('.login-sec .login-right__div');

    // Enter username
    await this.getById('username').sendKeys('mickey');

    // Enter password
    await this.getById('password').sendKeys('mouse');

    // Get button by ID then hit click on Log In button
    return this.getById('kc-login').click();
  }
}