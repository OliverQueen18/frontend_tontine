pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
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

        // Critique sur VPS 2–4 Go : 4096 Mo faisait planter le serveur
        string(
            name: 'NODE_HEAP_MB',
            defaultValue: '1536',
            description: 'Mémoire max Node (Mo) pour ng build. Passer à 1024 si OOM / plantage.'
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
        NODE_OPTIONS = "--max-old-space-size=${params.NODE_HEAP_MB}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                set -e
                echo "Build léger : heap Node=${params.NODE_HEAP_MB} Mo, 1 worker Angular"
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
            echo 'Echec — si le serveur plante (OOM), relancer avec NODE_HEAP_MB=1024'
        }
        always {
            sh '''
            docker image prune -f || true
            docker builder prune -f --filter until=24h || true
            '''
            cleanWs()
        }
    }
}
