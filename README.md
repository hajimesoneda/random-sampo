# ランダム散歩（Random Sampo）

## プロジェクト概要

ランダム散歩は、東京の駅をランダムに選んで新しい場所を発見するためのウェブアプリケーションです。地下鉄やJR線を含む東京の駅から、ユーザーに新しい探索地点を提案し、周辺の観光スポットも紹介します。

## なぜ作ったか

”知らない街を目的もなく訪れて散歩してみたい”という個人的な欲求により作成しました。

## 遊び方

- 暇な1日を確保
- アプリを起動すると東京都内の適当な駅が表示されるので出かけてみる
- 訪問情報を記録する

## 主な機能

1. ランダム駅選択
   - 東京の駅をランダムに選択（地下鉄とJR線を含む）
   - 選択された駅の詳細情報を表示（駅名、路線情報）

2. 地図表示
   - Google Maps上で駅の位置を表示
   - 選択されたスポットへのルートを地図上に表示

3. 周辺スポット表示
   - 駅周辺のおすすめスポットを表示（観光スポット、カフェ、レストラン）
   - スポットの写真と簡単な情報を表示

4. お気に入り機能
   - 気に入った駅をお気に入りに登録
   - お気に入りリストから駅を選択して詳細を表示

5. 訪問記録
   - 駅への訪問を記録（日付、天気、メモ）
   - 訪問済みの駅リストを表示
   - 訪問情報の編集と削除

6. Google Maps連携
   - 「Google Mapで開く」ボタンで外部のGoogle Mapsアプリで駅とスポットを表示
   - 選択したスポットへのルートをGoogle Mapsで表示
  
## インストールと起動

リポジトリをクローンします：

```bash
git clone https://github.com/yourusername/random-sampo.git
cd random-sampo
```

プロジェクトルートの
.env.local.sampleファイルを参考に.env.localを作成

Google ConsoleからGoogle Maps API、Places API、Direction APIを有効化してAPIキーを取得、
.env.local
に記載する
＊.env.localファイルは.gitignoreに追加してリポジトリの管理対象外にしてください。

以下でローカルサーバー起動
```bash
npm install
npm run dev
```

## converterディレクトリの中身について

converter/geojsonには、
https://uedayou.net/jrslod-geojson-downloader/
からダウンロードした、都内の地下鉄駅のGeoJSONが格納されています。

- conveter.py・・・geojsonディレクトリに格納されているgeojsonファイルすべてをこのアプリ用のjson形式に変換し、converted_jsonディレクトリに保存するスニペット
- merge_list.py・・・converted_jsonディレクトリ内のjsonファイルを結合してmerged_list.jsonを生成する

生成したmerged_list.jsonはdata/tokyo-stations.jsonとして配置

## 補足

- 訪問済み駅情報とお気に入りの駅はブラウザのCookieに保存されます。
- おすすめスポットの写真はGoggle Places APIで取得しています

## 開発方針

"Keep it simple, stupid."

## 予定
- iOSモバイルアプリ化(Capacitor, ReactNative, etc)
- アプリの動画作成
- ビジュアル要素追加（ロゴ、アイコンなど）
- 駅・スポットへのチェックイン機能
- データをクラウドに保存（Firebase, Supabase, etc）
- 設定機能追加（おすすめスポットの編集, etc）
- おすすめスポットの駅からの距離をカスタマイズできるように（徒歩だけではなく、自転車やLUUP向け）
- SNS的な何か
- ゲームモード追加