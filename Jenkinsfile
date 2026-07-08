pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        choice(
            name: 'BUILD_CONFIGURATION',
            choices: ['docker', 'production', 'development'],
            description: 'Configuration Angular (docker recommande pour l\'image CI)'
        )

        string(
            name: 'BACKEND_HOST',
            defaultValue: 'pieml-backend',
            description: 'Hote du backend pour le proxy Nginx (/api)'
        )

        string(
            name: 'BACKEND_PORT',
            defaultValue: '7000',
            description: 'Port du backend pour le proxy Nginx'
        )

        booleanParam(
            name: 'PUSH_DOCKER',
            defaultValue: true,
            description: 'Pousser l\'image Docker sur le registry'
        )
    }

    environment {
        APP_NAME     = 'pieml-frontend'
        DOCKER_IMAGE = 'oliverqueen18/pieml-frontend'
        DOCKER_TAG   = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Angular') {
            steps {
                sh "npm run build:${params.BUILD_CONFIGURATION}"
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                docker build \
                  --build-arg BUILD_CONFIGURATION=${params.BUILD_CONFIGURATION} \
                  -t ${DOCKER_IMAGE}:${DOCKER_TAG} \
                  -t ${DOCKER_IMAGE}:latest \
                  .
                """
            }
        }

        stage('Docker Push') {
            when {
                expression { params.PUSH_DOCKER }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                    echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                    docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline PIEML frontend reussi (${DOCKER_IMAGE}:${DOCKER_TAG})"
        }
        failure {
            echo 'Pipeline PIEML frontend echoue'
        }
        always {
            cleanWs()
        }
    }
}
