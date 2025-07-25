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
   - 東京の駅をランダムに選択
   - 選択された駅の詳細情報を表示（駅名、路線情報）

2. 地図表示
   - Google Maps上で駅の位置を表示
   - 選択されたスポットへのルートを地図上に表示
   - 徒歩での所要時間を表示

3. 周辺スポット表示
   - 駅周辺のおすすめスポットを表示（最大4つ）
   - カスタマイズ可能なカテゴリー（デフォルト：カフェ、レストラン、銭湯、観光スポット）
   - スポットの写真と簡単な情報を表示

4. お気に入り機能
   - 気に入った駅をお気に入りに登録
   - お気に入りリストから駅を選択して詳細を表示

5. 訪問記録
   - 駅への訪問を記録（日付、天気、メモ）
   - 訪問済みの駅リストを表示
   - 訪問情報の編集と削除

6. 設定
   - スポットのカテゴリーをカスタマイズ（最大8つまで）
   - カテゴリーの追加、削除、管理

7. Google Maps連携
   - 「Google Mapで開く」ボタンで外部のGoogle Mapsアプリで駅とスポットを表示
   - 選択したスポットへのルートをGoogle Mapsで表示
  
## インストールと起動

1. リポジトリをクローン：
   git clone https://github.com/yourusername/random-sampo.git
   cd random-sampo

2. 依存関係をインストール：
   npm install

3. shadcnをインストール：
   npx shadcn@latest init

   インストール時に以下のオプションを選択してください：
   - Would you like to use TypeScript? › Yes
   - Which style would you like to use? › Default
   - Which color would you like to use as base color? › Slate
   - Where is your global CSS file? › app/globals.css
   - Do you want to use CSS variables for colors? › Yes
   - Where is your tailwind.config.js located? › tailwind.config.js
   - Configure the import alias for components: › @/components
   - Configure the import alias for utils: › @/lib/utils
   - Are you using React Server Components? › Yes

4. 必要なshadcnコンポーネントをインストール：
   ```
   npx shadcn@latest add button card dialog input label select checkbox tabs
	 ```
5. 環境変数を設定：
   .env.localファイルを作成し、以下の変数を設定してください：
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key

6. 開発サーバーを起動：
   npm run dev
   ブラウザで http://localhost:3000 を開いてアプリケーションにアクセスしてください。

7. プロダクションビルドを作成：
   npm run build

8. プロダクションビルドを実行：
   npm start

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
- おすすめスポットの駅からの距離をカスタマイズできるように（徒歩だけではなく、自転車やLUUP向け）
- SNS的な何か
- ゲームモード追加