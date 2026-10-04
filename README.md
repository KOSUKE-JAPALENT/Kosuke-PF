# 鈴木孝輔 ポートフォリオ

日英切替対応の静的Webサイトです。**記事欄**は Markdown 正本 → ビルドで HTML 生成（Vercel デプロイ時に自動実行）です。

## 確認方法

`index.html` をブラウザで開いてください。ローカルサーバーを使う場合は、このフォルダをルートにして配信します。

## Vercel で公開（GitHub 連携）

1. [Vercel](https://vercel.com) に GitHub アカウントでログイン
2. **Add New → Project** → リポジトリ **KOSUKE-JAPALENT/Kosuke-PF** を Import
3. 設定
   - **Framework Preset:** Other
   - **Root Directory:** `./`（リポジトリ直下）
   - **Build Command:** `npm run build`（`vercel.json` 同梱）
   - **Output Directory:** `.`
   - **Install Command:** `npm install`
4. **Deploy** → `main` への push のたびに自動デプロイ

`vercel.json` を同梱しているので、上記のまま Import すれば動きます。

## 公開前に確認する項目

- YouTube登録者数・総再生数
- 指導実績500名以上
- 受講生満足度100%のアンケート対象・実施時期
- 受講生事例の掲載同意
- X「海外リモートワーク25選」の記事個別URL
- LinkWay・リモート出稼ぎ大学の個別ページURL
- 1on1予約ページを使う場合は、問い合わせボタンのリンク先

## 記事（SEO用ブログ）

- 正本: `content/articles/*.md`（手順: 同フォルダの `README.md`）
- 公開URL: `/articles/`（一覧）、`/articles/{slug}/`（個別）
- ローカル生成: リポジトリ直下で `npm run build:articles`（Node のみ、追加パッケージ不要）

## 主なファイル

- `index.html`：ページ構成・本文
- `styles.css`：デザイン・レスポンシブ対応
- `script.js`：日英切替・スクロール表示
- `assets/`：写真・ロゴ
- `pdf.html`：商談前共有用PDFの元HTML
- `鈴木孝輔_会社概要.pdf`：商談前共有用PDF（落ち着いたトーン）
- `slides-content.md`：登壇資料10枚の原稿
- `鈴木孝輔_登壇資料.pptx`：登壇資料PPTX（Google Slidesへ取り込み可）

## 資料の再生成

```bash
# PDF
cd scripts/generate-portfolio-pdf
npm run generate

# PPTX
node generate-slides.js

# Google Slidesへアップロード
cd ../google-docs
node upload-portfolio-slides.mjs
```
