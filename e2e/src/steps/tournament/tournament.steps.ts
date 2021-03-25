import { Before, Given, Then, When } from 'cucumber';
import { expect } from 'chai';

import { Utils } from '../../pages/utils.po';
import { TournamentPage } from '../../pages/tournament.po';

let tournament: TournamentPage;
let utils: Utils;

Before(() => {
  tournament = new TournamentPage();
  utils = new Utils();
});

Given(/^I am on the home pages$/, async () => {
  await utils.navigateToPath('');
});

When(/^I move to the tournament page$/, async () => {
  await utils.getByCSS('#navbar-menu > div:nth-child(1) > a:nth-child(4)').click();
});
Then(/^I should be redirected to keycloak$/, async () => {
  await utils.waitForAngularEnabled(false)
  utils.getUrlPath().then(url => {    
    expect(url).to.contain('keycloak');
  })
  await utils.waitForAngularEnabled(true)
});
