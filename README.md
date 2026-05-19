# protopedia-mcp

[ProtoPedia](https://protopedia.net) の作品を Claude / 他 MCP クライアントから検索するための [Model Context Protocol](https://modelcontextprotocol.io) サーバー。公式の [ProtoPedia API v2](https://protopediav2.docs.apiary.io/) を薄くラップしている。

## できること

3 つのツールを提供:

| Tool | 用途 |
|---|---|
| `search_prototypes` | 作品を絞り込み検索 (ユーザー名 / タグ / 素材 / イベント / 受賞 / ステータス)。レスポンスは薄く整形 — 巨大な `freeComment` markdown は含めない |
| `get_prototype` | `prototypeId` で 1 件取得。**こちらは full** で `freeComment` / `systemDescription` を含む |
| `list_materials` | 開発素材 (フレームワーク / デバイス / API 等) の一覧。`search_prototypes` に渡す正規の `materialNm` を調べる用 |

**書き込み系 API (`POST/DELETE /api/event/relation`) は意図的に未実装**。LLM の誤操作リスクを避けるため。

## 注意: `*Nm` 系フィルタは完全一致

ProtoPedia API の `userNm`, `tagNm`, `materialNm`, `eventNm`, `awardNm` は **完全一致** マッチ。部分一致や全文検索ではない。「AWS を使った作品を探したい」場合は、先に `list_materials` を呼んで正規名 (例: `"アマゾン ウェブ サービス（AWS）"`) を確認してから `search_prototypes({ materialNm: "..." })` を呼ぶ。

## セットアップ

### 1. Bearer Token を発行

ProtoPedia の [アプリケーション設定ページ](https://protopedia.net/settings/application) から API トークンを取得する。

### 2. ビルド

```bash
git clone https://github.com/qurihara/protopedia_mcp.git
cd protopedia_mcp
npm install
npm run build
```

`dist/index.js` が生成される (実行可能 stdio MCP サーバー)。

### 3. Claude Code / Desktop に登録

#### Claude Code (CLI)

```bash
claude mcp add protopedia \
  --env PROTOPEDIA_API_TOKEN=YOUR_TOKEN_HERE \
  -- node /absolute/path/to/protopedia_mcp/dist/index.js
```

#### 手動で `.mcp.json` / `claude_desktop_config.json` に書く場合

```json
{
  "mcpServers": {
    "protopedia": {
      "command": "node",
      "args": ["/absolute/path/to/protopedia_mcp/dist/index.js"],
      "env": {
        "PROTOPEDIA_API_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Claude を再起動すると `search_prototypes` / `get_prototype` / `list_materials` が使えるようになる。

## ツール仕様

### `search_prototypes`

| 入力 | 型 | 説明 |
|---|---|---|
| `userNm` | string? | ユーザー表示名 (完全一致) |
| `tagNm` | string? | タグ名 (完全一致) |
| `materialNm` | string? | 開発素材名 (完全一致) |
| `eventNm` | string? | イベント名 (完全一致) |
| `eventId` | number? | イベント ID |
| `awardNm` | string? | 受賞名 (完全一致) |
| `status` | `"idea" \| "developing" \| "completed" \| "memorial"`? | 内部で 1〜4 に変換して送信 |
| `limit` | number? | 既定 20, 最大 100 |
| `offset` | number? | 既定 0 |

返り値 (slim):

```ts
{
  count: number,
  results: Array<{
    id: number,
    url: string,                // "https://protopedia.net/prototype/{id}"
    prototypeNm: string,
    summary: string,
    teamNm: string,
    mainUrl: string,            // メイン画像
    videoUrl: string,
    officialLink: string,
    relatedLinks: string[],     // relatedLink + relatedLink2..5
    users: { name: string, handle: string }[],
    tags: string[],
    materials: string[],
    events: { name: string, slug: string }[],
    awards: string[],
    status: "idea" | "developing" | "completed" | "memorial" | "unknown",
    licenseType: "ccby" | "none" | "unknown",
    releaseFlg: "draft" | "public" | "private" | "unknown",
    viewCount: number,
    goodCount: number,
    commentCount: number,
    createDate: string,
    releaseDate: string,
    updateDate: string,
  }>
}
```

意図的に省略しているフィールド: `freeComment`, `systemDescription`, `uuid`, `createId`, `updateId`, `revision`, `slideMode`, `thanksFlg`。詳細は `get_prototype` で取る。

### `get_prototype`

| 入力 | 型 | 説明 |
|---|---|---|
| `prototypeId` | number (必須) | 作品の ID |

返り値: `search_prototypes` の結果の 1 要素と同じ形 **+** `freeComment: string`, `systemDescription: string`。存在しない ID なら `null`。

### `list_materials`

| 入力 | 型 | 説明 |
|---|---|---|
| `companySlug` | string? | 会社スラグ (例: `"ma"`) |
| `limit` | number? | 既定 50, 最大 200 |
| `offset` | number? | 既定 0 |

返り値:

```ts
{
  count: number,
  results: Array<{
    id: number,
    materialNm: string,
    summary: string,          // freeComment を 500 文字で切り詰め
    companyNm: string,
    companySlug: string,
    categoryNm: string,
    subCategoryNms: string[],
    providerUrl: string,
    logoUrl: string,
  }>
}
```

## 開発

```bash
npm run dev        # tsc --watch
npm run typecheck  # 型チェックだけ
```

MCP Inspector で動作確認:

```bash
export PROTOPEDIA_API_TOKEN=...
npx @modelcontextprotocol/inspector node dist/index.js
```

## ライセンス

MIT
