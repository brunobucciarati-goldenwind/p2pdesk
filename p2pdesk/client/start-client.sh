#!/bin/bash

# P2P Remote Desktop Client 起動スクリプト

CLIENT_FILE="/app/p2pdesk/client/index.html"

echo "=================================================="
echo "🖥️  P2P Remote Desktop Client"
echo "=================================================="
echo ""
echo "📄 クライアントファイル: $CLIENT_FILE"
echo ""
echo "💡 使用方法:"
echo "   1. ブラウザで以下のファイルを開いてください:"
echo "      file://$CLIENT_FILE"
echo ""
echo "   2. または、以下のコマンドでブラウザを開きます:"
echo "      \$BROWSER file://$CLIENT_FILE"
echo ""
echo "   3. サーバーで表示されたIPアドレスを入力して接続"
echo ""

# ブラウザが設定されている場合は自動で開く
if [ -n "$BROWSER" ]; then
    echo "🚀 ブラウザを起動中..."
    "$BROWSER" "file://$CLIENT_FILE" &
    echo "✅ ブラウザが起動しました"
else
    echo "⚠️  \$BROWSER 環境変数が設定されていません"
    echo "   手動でブラウザを開いてファイルにアクセスしてください"
fi

echo ""
echo "=================================================="
