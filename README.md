# 👩‍🔬📋👨‍🔬 SystemTestsScaffold

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.1.

## 🏃‍♂️Running end-to-end tests locally

Run `npm run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/). Defaults to looking for an angular app on `http://localhost:4200` but you can over write this by setting `export E2E_TEST_ROUTE=http://my-app.example.com` prior to execution.

You can run `npm run e2e:headless` if you don't want the browser popping up annoying you 🤗.


## 🏃‍♀️Running end-to-end tests against Selenium Grid
1. Deploy Zalenium using helm to a target namespace eg `testy-mctestface`:
```bash
helm repo add zalenium-github https://raw.githubusercontent.com/zalando/zalenium/master/charts/zalenium
helm install uj --namespace testy-mctestface zalenium-github/zalenium --set hub.openshift.route.enabled=true
```
2. Export the endpoint to be tested and run the tests pointing to your grid. If running in Jenkins on OpenShift, and Zalenium is in the same project you can skip setting `ZALENIUM_SERVICE_HOST`.
```bash
export ZALENIUM_SERVICE_HOST=(oc get routes uj-zalenium -n testy-mctestface -o jsonpath='{.spec.host}')
export E2E_TEST_ROUTE=https://my-app.example.com
npm run e2e:ci
```

For a working example using Jenkins, see the Jenkinsfile in the root of this project

## 📰Reporting
A Cucubmber JSON report for consumption in CI is located in `./reports/` along with a HTML report supporting multiple browsers out of the box `./reports/index.html`
