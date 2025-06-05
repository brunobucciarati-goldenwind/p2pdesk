# 開発用ステージ
FROM node:24 AS development

# 対話処理を無効化（インストール時の確認を省略するため）
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo

RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの作成
WORKDIR /app

# requirements.txt に記載されたPythonパッケージをインストール
COPY requirements.txt .
RUN pip3 install --upgrade pip --break-system-packages && pip3 install -U -r requirements.txt --break-system-packages

# コンテナ起動時に bash を起動する
CMD ["/bin/bash"]
