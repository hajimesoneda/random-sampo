# Random Sampo (ランダム散歩)

Random Sampo は、東京の駅をランダムに選んで新しい場所を発見するためのウェブアプリケーションです。

## 現在の機能

- 東京の駅をランダムに選択（地下鉄とJR線を含む）
- 選択された駅の詳細情報を表示
  - 駅名
  - 路線情報
  - Google Maps上での位置表示
- 駅周辺のおすすめスポットを表示（観光スポット、カフェ、レストラン）
- 駅への訪問を記録
  - 訪問日
  - 天気
  - メモ
- 訪問済みの駅リストを表示
- 訪問済みの駅を選択対象から除外
  
## インストールと起動

リポジトリをクローンします：

```bash
git clone https://github.com/yourusername/random-sampo.git
cd random-sampo
```

プロジェクトルートの
.env.local.sampleファイルを参考に.env.localを作成

Google ConsoleからGoogle Maps API、Places APIを有効化して取得、
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

- 訪問済み駅情報はブラウザのCookieに保存されます。
- おすすめスポットの写真はGoggle Places APIで取得