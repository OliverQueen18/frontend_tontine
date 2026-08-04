pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        // Build Angular + Docker : prévoir au moins 20 min sur petits serveurs
        timeout(time: 45, unit: 'MINUTES')
    }

    parameters {
        choice(
            name: 'BUILD_CONFIGURATION',
            choices: ['production', 'development'],
            description: 'Configuration Angular (production pour déploiement)'
        )

        string(
            name: 'BACKEND_HOST',
            defaultValue: 'backend-tontine',
            description: 'Hote du backend pour le proxy Nginx (/api)'
        )

        string(
            name: 'BACKEND_PORT',
            defaultValue: '6000',
            description: 'Port du backend pour le proxy Nginx'
        )

        booleanParam(
            name: 'PUSH_DOCKER',
            defaultValue: true,
            description: 'Pousser l\'image Docker sur le registry'
        )
    }

    environment {
        APP_NAME     = 'frontend-tontine'
        DOCKER_IMAGE = 'oliverqueen18/frontend-tontine'
        DOCKER_TAG   = "${BUILD_NUMBER}"
        // Limite mémoire Node pendant ng build (évite OOM sur Jenkins)
        NODE_OPTIONS = '--max-old-space-size=4096'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // Build uniquement dans Docker (évite npm ci + ng build en double sur l'agent Jenkins)
        stage('Docker Build') {
            steps {
                sh """
                docker build \
                  --build-arg BUILD_CONFIGURATION=${params.BUILD_CONFIGURATION} \
                  --build-arg NODE_OPTIONS="${NODE_OPTIONS}" \
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
            echo "Pipeline TONTINE frontend reussi (${DOCKER_IMAGE}:${DOCKER_TAG})"
        }
        failure {
            echo 'Pipeline TONTINE frontend echoue — relancer le job si Jenkins a redémarré pendant le build'
        }
        always {
            cleanWs()
        }
    }
}
