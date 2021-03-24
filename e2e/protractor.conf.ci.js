const _ = require('lodash');
const protractorBase = require('./protractor.conf');

const overRideConfig = {
  seleniumAddress: `http://${process.env.ZALENIUM_SERVICE_HOST}/wd/hub`,
  baseUrl: `http://${process.env.E2E_TEST_ROUTE}/`,
  directConnect: false,
  multiCapabilities: [
    {
      browserName: 'chrome',
      chromeOptions: {
        args: ['--window-size=1280x800', '--headless', '--disable-gpu', '--no-sandbox'],
      },
    },
    {
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: ['--headless', '--window-size=1280,800', '--width=1280', '--height=800'],
      },
    },
  ],
  // Here the magic happens
  plugins: [
    {
      package: 'protractor-multiple-cucumber-html-reporter-plugin',
      options: {
        // read the options part for more options
        automaticallyGenerateReport: true,
        removeExistingJsonReportFile: true,
        reportPath: './reports/',
      },
    },
  ],
};

const thing = _.merge({}, protractorBase.config, overRideConfig);

exports.config = thing;
