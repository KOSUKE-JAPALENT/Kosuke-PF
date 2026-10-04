# ポートフォリオ記事（Markdown 正本）

公開用 HTML は `npm run build:articles` で `articles/` に生成されます。Vercel デプロイ時も同じコマンドが走ります。

## 新規記事

1. `_template.md` を複製して `yyyy-mm-dd-スラッグ.md` など ASCII 名で保存（**パスに絵文字を使わない**）
2. frontmatter の `draft: false` に変更
3. リポジトリ直下で `npm install`（初回のみ）→ `npm run build`
4. 生成された `articles/` をコミットして push

## frontmatter

| 項目 | 必須 | 説明 |
|------|------|------|
| `title` | 公開時は必須 | ページタイトル |
| `description` | 推奨 | meta description（120字前後） |
| `date` | 推奨 | `YYYY-MM-DD` |
| `slug` | 任意 | URL（省略時はファイル名）。例: `remote-work-beginner` → `/articles/remote-work-beginner/` |
| `draft` | 任意 | `true` の間はビルド対象外 |

## Obsidian との運用例

- パトリック内で下書き → 公開時だけこのフォルダへコピー（または Remotely Save で PF リポジトリと同期）
- 英語版は後から `slug-en.md` など別ファイルで追加する想定（現状は日本語のみ）
