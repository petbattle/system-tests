pipeline {
    agent {
        label "master"
    }
    environment {
        // JOB TAKES TWO PARAMS:
        // APP_NAME: to know what app to update in git if successful
        // VERSION: the version to pin the app to in git

        // GLobal Vars
        E2E_APP_NAME = "learning-experience-platform"
        JENKINS_TAG = "master"
        PROJECT_NAMESPACE = "labs-test"

        // Config repo managed by ArgoCD details
        ARGOCD_CONFIG_REPO = "github.com/who-lxp/lxp-config.git"
        ARGOCD_CONFIG_REPO_PATH = "lxp-deployment/values-staging.yaml"
        ARGOCD_CONFIG_REPO_BRANCH = "master"

        // Credentials bound in OpenShift
        GIT_CREDS = credentials("${OPENSHIFT_BUILD_NAMESPACE}-git-auth")
    }

    // The options directive is for configuration that applies to the whole job.
    options {
        buildDiscarder(logRotator(numToKeepStr: '50', artifactNumToKeepStr: '2'))
        timeout(time: 15, unit: 'MINUTES')
        ansiColor('xterm')
    }

    stages {
        stage("system tests") {
            agent {
                node {
                    label "jenkins-slave-npm"
                }
            }
            steps {
                echo '### set env to test against ###'
                script {
                    // TODO - Check if i can just use Zalenium service route....?
                    env.E2E_TEST_ROUTE = "oc get route/test-${E2E_APP_NAME} --template='{{.spec.host}}' -n ${PROJECT_NAMESPACE}".execute().text.minus("'").minus("'")
                }

                echo '### checkout correct revision ###'
                sh 'git checkout ${JENKINS_TAG}'

                echo '### Install deps ###'
                sh 'npm install'

                echo '### Seed the api ###'
                // sh './seed-backend.sh'

                echo '### Running systems tests ###'
                sh '''
                    echo Testing against ${E2E_TEST_ROUTE}
                    npm run e2e:ci
                '''
            }
            post {
                always {
                    // publish html
                    publishHTML target: [
                        allowMissing: false,
                        alwaysLinkToLastBuild: false,
                        keepAll: true,
                        reportDir: 'reports/',
                        reportFiles: 'index.html',
                        reportName: 'System Test Report'
                    ]
                    // 
                    cucumber 'reports/json-output-folder/*.json'
                    // https://github.com/jenkinsci/cucumber-reports-plugin#automated-configuration
                    cucumber buildStatus: 'UNSTABLE',
                        failedFeaturesNumber: 1,
                        failedScenariosNumber: 1,
                        skippedStepsNumber: 1,
                        failedStepsNumber: 1,
                        reportTitle: 'System Test report',
                        fileIncludePattern: 'reports/json-output-folder/*.json',
                        sortingMethod: 'ALPHABETICAL',
                        trendsLimit: 100
                }
            }
        }


        stage("Promote to Staging") {
            agent {
                node {
                    label "jenkins-slave-argocd"
                }
            }
            when {
                expression { GIT_BRANCH ==~ /(.*master)/ }
            }
            steps {
                sh  '''
                    git clone https://${ARGOCD_CONFIG_REPO} config-repo
                    cd config-repo
                    git checkout ${ARGOCD_CONFIG_REPO_BRANCH}

                    yq w -i ${ARGOCD_CONFIG_REPO_PATH} "applications.name==${APP_NAME}.source_ref" ${VERSION}

                    git config --global user.email "jenkins@rht-labs.bot.com"
                    git config --global user.name "Jenkins"
                    git config --global push.default simple

                    git add ${ARGOCD_CONFIG_REPO_PATH}
                    # grabbing the error code incase there is nothing to commit and allow jenkins proceed
                    git commit -m "🚀 AUTOMATED COMMIT - Deployment new app version ${VERSION} 🚀" || rc=$?
                    git remote set-url origin  https://${GIT_CREDS_USR}:${GIT_CREDS_PSW}@${ARGOCD_CONFIG_REPO}
                    git push -u origin ${ARGOCD_CONFIG_REPO_BRANCH}
                '''

                // sh  '''
                //     echo "merge versions back to the original GIT repo as they should be persisted?"
                //     git checkout ${GIT_BRANCH}
                //     yq w -i chart/Chart.yaml 'appVersion' ${VERSION}
                //     yq w -i chart/Chart.yaml 'version' ${VERSION}

                //     git add chart/Chart.yaml
                //     git commit -m "🚀 AUTOMATED COMMIT - Deployment of new app version ${VERSION} 🚀" || rc=$?
                //     git remote set-url origin https://${GIT_CREDS_USR}:${GIT_CREDS_PSW}@github.com/springdo/pet-battle.git
                //     git push
                // '''
            }
        }
    }
}
