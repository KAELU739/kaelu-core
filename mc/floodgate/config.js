# ============================================
#  Floodgate - BE プレイヤー認証用 完全版設定
#  最適化: Paper / Geyser 連携
# ============================================

# Floodgate が生成する公開鍵ファイル
key-file-name: public-key.pem

# BE プレイヤーの名前に付ける prefix
# JE プレイヤーと区別しやすくする
username-prefix: "BE_"

# プレイヤー名の長さ制限
# BE 側は長い名前が来ることがあるため、JE 側に合わせて調整
username-length:
  min: 3
  max: 16

# BE プレイヤーのスキンを JE 側に反映する
# true にすると JE 側でも BE スキンが表示される
allow-third-party-capes: true
allow-third-party-skins: true

# UUID の生成方式
# floodgate: BE プレイヤー専用の UUID を生成（推奨）
# offline: オフライン UUID（非推奨）
# online: Mojang 認証（BE では不可）
uuid-type: floodgate

# BE プレイヤーのデバイス情報を JE 側に送る
# あなたの JSON ログに活用できる
send-floodgate-data: true

# BE プレイヤーのデバイス名を表示する
# 例: "iOS", "Android", "Windows10"
show-device-os: true

# BE プレイヤーの接続メッセージ
# JE 側のチャットに表示される
login-messages:
  enabled: true
  message: "§a[BE] {username} が Bedrock から参加しました"

# BE プレイヤーの権限設定
# OP を与える場合は JE 側で行う
permissions:
  default: []
  admin: []

# BE プレイヤーのチャットフォーマット
chat-prefix: "§b[BE]§r "

# BE プレイヤーのスキンキャッシュ
# パフォーマンス向上のため true 推奨
cache-skins: true

# BE プレイヤーのデバイス情報をログに残す
log-device-info: true

# BE プレイヤーの IP を JE 側に渡す
# あなたの JSON ログと相性が良い
forward-ip: true

# BE プレイヤーの言語設定を JE 側に渡す
forward-locale: true

# BE プレイヤーの XboxID を JE 側に渡す
forward-xuid: true
