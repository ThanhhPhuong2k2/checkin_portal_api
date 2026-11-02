#!/usr/bin/env groovy
pipeline {
    agent any
    parameters{
                string(
                    description: 'Branch to build',
                    defaultValue: 'develop',
                    name: 'BRANCH_BUILD',
                    trim: true
                )
                booleanParam(
                    defaultValue: true, 
                    description: 'Trigger job update with this image after build success', 
                    name: 'TRIGGER_UPDATE'
                )
                string(
                    defaultValue: '',
                    description: 'Version (optional, will override version file if provided)',
                    name: 'VERSION', 
                    trim: true
                )
    }
    stages {
        stage('Checkout Source') {
            steps {
                git branch: "${params.BRANCH_BUILD}", credentialsId: 'metadap.id_rsa', url: 'git@github.com:Asset-Tokenization/metadap_checkin_portal_api.git'
            }
        }

        stage('Load Version') {
            steps {
                script {
                    // Determine version from parameter or file
                    def version
                    if (params.VERSION) {
                        version = params.VERSION
                    } else {
                        // Load version from YAML file
                        def yaml = readYaml file: 'version.yaml'
                        version = yaml['version']
                    }
                    
                    // Check if the branch is a development branch
                    if (params.BRANCH_BUILD != 'main' && !params.BRANCH_BUILD.startsWith('release/')) {
                        version = "${version}-dev"
                    }
                    // Print version to console
                    echo "Project Version: ${version}"

                    // Optionally, set version as an environment variable
                    env.RELEASE_VERSION = version
                }
            }
        }
    
        stage('Build image Dev') {
            steps{
                script{
                    echo "NODE_ENV=production"
                    echo "Build image with version ${env.RELEASE_VERSION}"
                    sh '''
                        mkdir -p src/pre-start/env/ && echo "NODE_ENV=production" > src/pre-start/env/.env;
                    '''
                    sh "docker build -t registry.metadap.io/checkin-portal-api:${env.RELEASE_VERSION} ."
                    echo 'Build Image Completed' 
                }
            }
        }
    
        stage('Pushing Image') {
            steps {
                script{
                    echo "pushing image registry.metadap.io/checkin-portal-api:${env.RELEASE_VERSION}"
                    sh "docker push registry.metadap.io/checkin-portal-api:${env.RELEASE_VERSION}"
                    sh  "docker rmi -f registry.metadap.io/checkin-portal-api:${env.RELEASE_VERSION}"
                    echo 'Push Image Completed' 
                }
            }
        }
        
        stage('Kubelet Apply') {
            when {
                expression{params.TRIGGER_UPDATE}
            }           
            steps {
                script{
                    echo "trigger deploy job"
                    build job:'metadap/deploy/retx-develop-deployments', parameters: [
                        string(name: 'DEPLOY_SERVICE_NAME', value: "checkin-portal-api"),
                        string(name: 'RELEASE_VERSION', value: "${env.RELEASE_VERSION}"),
                        string(name: 'PATCH_UPDATE', value: "true")
                    ]
                }
            }
        }
    }
}