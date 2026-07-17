#!/bin/bash
# install_on_vps.sh

# Обновляем систему и устанавливаем нужные пакеты
apt update && apt upgrade -y
apt install -y curl git apt-transport-https ca-certificates software-properties-common

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker root

# Установка Docker Compose
apt install -y docker-compose-plugin

echo "Docker установлен. Сейчас нужно склонировать репозиторий и запустить docker compose up -d"
