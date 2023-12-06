pipeline {
	agent {
		label "master"
	}
	parameters {
		string(name: 'APP_NAME', defaultValue: 'pet-battle', description: 'The service or app to be promote if successful eg pet-battle')
		string(name: 'VERSION', defaultValue: '1.2.0', description: 'The version of the given app to promote eg 1.2.1')
		string(name: 'CHART_VERSION', defaultValue: '1.0.6', description: 'The version of the chart to apply given app to promote eg 1.0.1')
	}
	environment {
		// GLobal Vars
		E2E_APP_NAME = "pet-battle"
		APP_OF_APP_NAME = "${APP_NAME}".replace("-", "_").plus("_stage")
		GIT_SSL_NO_VERIFY = true

		// ArgoCD Config Repo
		ARGOCD_CONFIG_REPO_PATH = "pet-battle/stage/values.yaml"
		ARGOCD_CONFIG_REPO_BRANCH = "main"

		// Credentials bound in OpenShift
		GIT_CREDS = credentials("${OPENSHIFT_BUILD_NAMESPACE}-git-auth")
		NEXUS_CREDS = credentials("${OPENSHIFT_BUILD_NAMESPACE}-nexus-password")

		// Nexus Artifact repo
		NEXUS_REPO_NAME="labs-static"
		NEXUS_REPO_HELM = "helm-charts"
	}
	options {
		buildDiscarder(logRotator(numToKeepStr: '50', artifactNumToKeepStr: '2'))
		timeout(time: 15, unit: 'MINUTES')
		ansiColor('gnome')
	}
	stages {
    stage("📝 Prepare Environment") {
      options {
        skipDefaultCheckout(true)
      }
      agent { label "master" }
      when {
        expression { GIT_BRANCH.startsWith("master") || GIT_BRANCH.startsWith("main") }
      }
      steps {
        script {
		  env.TEAM_NAME = "${GITLAB_GROUP_NAME}"
		  env.DESTINATION_NAMESPACE = "${TEAM_NAME}-stage"
		  env.PROJECT_NAMESPACE = "${TEAM_NAME}-test"
		  env.ARGOCD_CONFIG_REPO = "${GITLAB_HOST}/${GITLAB_GROUP_NAME}/tech-exercise.git"
		  env.IMAGE_REPOSITORY = 'image-registry.openshift-image-registry.svc:5000'
        }
        sh 'printenv'
      }
    }
    stage("🧪 system tests") {
			agent {
				label "jenkins-agent-npm"
			}
			steps {
				echo '### set env to test against ###'
				script {
					env.E2E_TEST_ROUTE = "oc get route/${E2E_APP_NAME} --template='{{.spec.host}}' -n ${PROJECT_NAMESPACE}".execute().text.minus("'").minus("'")
				}
				sh 'printenv'

				echo '### Install deps ###'
				sh 'npm ci'

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
		stage("🚚 Promote image to Stage") {
		options {
			skipDefaultCheckout(true)
		}
		agent { label "master" }
		when {
			expression { GIT_BRANCH.startsWith("master") || GIT_BRANCH.startsWith("main") }
		}
		steps {
			sh '''
				oc tag ${PROJECT_NAMESPACE}/${APP_NAME}:${VERSION} ${DESTINATION_NAMESPACE}/${APP_NAME}:${VERSION}
			'''
		}
		}
		stage("🚚 Deploy to Stage") {
			agent {
				label "jenkins-agent-argocd"
			}
			when {
				expression { GIT_BRANCH.startsWith("master") || GIT_BRANCH.startsWith("main") }
			}
			steps {
				echo '### Commit new image tag to git ###'
				sh  '''
					git clone https://${GIT_CREDS}@${ARGOCD_CONFIG_REPO} config-repo
					cd config-repo
					git checkout ${ARGOCD_CONFIG_REPO_BRANCH} # master or main
		
					PREVIOUS_VERSION=$(yq eval .applications.\\"${APP_NAME}\\".values.image_version "${ARGOCD_CONFIG_REPO_PATH}")
					PREVIOUS_CHART_VERSION=$(yq eval .applications.\\"${APP_NAME}\\".source_ref "${ARGOCD_CONFIG_REPO_PATH}")

					# patch ArgoCD App config with new app & chart version
					yq eval -i .applications.\\"${APP_NAME}\\".source_ref=\\"${CHART_VERSION}\\" "${ARGOCD_CONFIG_REPO_PATH}"
					yq eval -i .applications.\\"${APP_NAME}\\".values.image_version=\\"${VERSION}\\" "${ARGOCD_CONFIG_REPO_PATH}"
					yq eval -i .applications.\\"${APP_NAME}\\".values.image_namespace=\\"${DESTINATION_NAMESPACE}\\" "${ARGOCD_CONFIG_REPO_PATH}"
					yq eval -i .applications.\\"${APP_NAME}\\".values.image_repository=\\"${IMAGE_REPOSITORY}\\" "${ARGOCD_CONFIG_REPO_PATH}"

					# Commit the changes :P
					git config --global user.email "jenkins@rht-labs.bot.com"
					git config --global user.name "Jenkins"
					git config --global push.default simple
					git add ${ARGOCD_CONFIG_REPO_PATH}
					git commit -m "🚀 AUTOMATED COMMIT - Deployment of ${APP_NAME} at version ${VERSION} 🚀" || rc=$?
					git remote set-url origin  https://${GIT_CREDS}@${ARGOCD_CONFIG_REPO}
					git push -u origin ${ARGOCD_CONFIG_REPO_BRANCH}

					# verify the deployment by checking the VERSION against PREVIOUS_VERSION
					until [ "$label" == "${VERSION}" ]; do
						echo "${APP_NAME}-${VERSION} version hasn't started to roll out"
						label=$(oc get dc/${APP_NAME} -o yaml -n ${DESTINATION_NAMESPACE}  | yq e '.metadata.labels["app.kubernetes.io/version"]' -)
						sleep 1
					done
					oc rollout status --timeout=2m dc/${APP_NAME} -n ${DESTINATION_NAMESPACE} || rc1=$?
					if [[ $rc1 != '' ]]; then
						yq eval -i .applications.\\"${APP_NAME}\\".source_ref=\\"${PREVIOUS_CHART_VERSION}\\" "${ARGOCD_CONFIG_REPO_PATH}"
						yq eval -i .applications.\\"${APP_NAME}\\".values.image_version=\\"${PREVIOUS_VERSION}\\" "${ARGOCD_CONFIG_REPO_PATH}"

						git add ${ARGOCD_CONFIG_REPO_PATH}
						git commit -m "😢🤦🏻‍♀️ AUTOMATED COMMIT - ${APP_NAME} deployment is reverted to version ${PREVIOUS_VERSION} 😢🤦🏻‍♀️" || rc2=$?
						git push -u origin ${ARGOCD_CONFIG_REPO_BRANCH}
						# TODO - check the roll back has not failed also...
						exit $rc1
					else
							echo "${APP_NAME} v${VERSION} deployment in ${DESTINATION_NAMESPACE} is successful 🎉 🍪"
					fi
				'''
			}
		}
	}
}
