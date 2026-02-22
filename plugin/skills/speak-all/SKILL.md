---
name: speak-all
description: CC Mascotの発話をすべてのセッションに戻します
model: haiku
context: fork
---

# CC Mascot: すべてのセッションを発話

CC Mascotアプリの発話フィルタを解除し、すべてのClaude Codeセッションの応答を発話対象に戻します。

## 手順

1. active-sessionファイルを削除する
2. 完了メッセージを表示する

OSに応じて以下のいずれかのBashコマンドを実行してください:

macOS:
```bash
rm -f "$HOME/Library/Application Support/cc-mascot/active-session"
```

Windows:
```bash
rm -f "$APPDATA/cc-mascot/active-session"
```

実行後、「CC Mascotの発話をすべてのセッションに戻しました。」とだけ報告してください。
報告時、作業内容について詳しく説明する必要はありません。
