#!/bin/bash

# イメージ名を設定
IMAGE_NAME="p2pdesk"
TAG="latest"

# カレントディレクトリをマウントしてコンテナを実行
echo "Running Docker container from image: ${IMAGE_NAME}:${TAG}..."
docker run -it --rm \
  -v "$(pwd):/app" \
  -w /app \
  -p 8080:8080 \
  "${IMAGE_NAME}:${TAG}"