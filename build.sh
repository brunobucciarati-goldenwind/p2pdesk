#!/bin/bash

# イメージ名を設定
IMAGE_NAME="p2pdesk"
TAG="latest"

# イメージをビルド
echo "Building Docker image: ${IMAGE_NAME}:${TAG}..."
docker build -t "${IMAGE_NAME}:${TAG}" .

echo "Build completed."