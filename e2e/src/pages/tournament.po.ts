import { browser, by, element } from 'protractor';

export class TournamentPage {
  getTitleText(): Promise<string> {
    return element(by.css('body > app-root > app-shell > app-home > div > h4')).getText() as Promise<string>;
  }
}
