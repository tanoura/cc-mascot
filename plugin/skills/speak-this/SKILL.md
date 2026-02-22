---
name: speak-this
description: CC Mascotの発話をこのセッションのみに絞り込みます
model: haiku
context: fork
---

# CC Mascot: このセッションのみ発話

CC Mascotアプリの発話対象を、現在のClaude Codeセッションのみに絞り込みます。

## 手順

1. 環境変数 `$CC_MASCOT_SESSION_ID` からセッションIDを取得する
2. セッションIDをactive-sessionファイルに書き込む
3. 完了メッセージを表示する

OSに応じて以下のいずれかのBashコマンドを実行してください:

macOS:
```bash
echo -n "$CC_MASCOT_SESSION_ID" > "$HOME/Library/Application Support/cc-mascot/active-session"
```

Windows:
```bash
echo -n "$CC_MASCOT_SESSION_ID" > "$APPDATA/cc-mascot/active-session"
```

実行後、「CC Mascotの発話をこのセッションのみに切り替えました」とだけ報告してください。
報告時、作業内容について詳しく説明する必要はありません。

もし `$CC_MASCOT_SESSION_ID` が空の場合は、「セッションIDが取得できませんでした。CC Mascotプラグインが正しく設定されているか確認してください。」とだけ報告してください。
