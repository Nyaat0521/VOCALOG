# 代表曲の設定方法（VOCALOG）

## 何を編集する？
`data/songs.json` の「代表曲にしたい曲」に、以下の2つを追記するだけ

- `isRepresentative`: 代表曲フラグ（trueにする）
- `representativeOrder`: 並び順（小さいほど上）

---

## コピペ用（そのまま使える）

### 1曲だけ代表曲にする（並び順なし）
```json
"isRepresentative": true
```

### 複数曲を代表曲にする（並び順あり）
```json
"isRepresentative": true,
"representativeOrder": 1
```

---

## 例（完成形）

```json
{
  "id": "example-song-id",
  "title": "代表曲サンプル",
  "titleKana": "だいひょうきょくさんぷる",
  "producerId": "example-producer",
  "vocalId": "hatunemiku",
  "youtubeId": "",
  "niconicoId": "",
  "tags": ["初音ミク"],
  "released": "2020-01-01",
  "isRepresentative": true,
  "representativeOrder": 1
}
```

---

## 表示ルール（今の実装）

- Producerページの「代表曲」は、そのPの曲の中から `isRepresentative: true` の曲を集めて表示
- `representativeOrder` があれば、その順で並べる（1 → 2 → 3…）
- 1曲も設定されていない場合は、従来どおり「新着順トップ10」を表示


## 人気曲（popular）

人気曲の並びは `popularityScore`（数字が大きいほど上）で決まります。

例：
```json
{
  "id": "hibana",
  "isRepresentative": true,
  "representativeOrder": 1,
  "popularityScore": 95
}
```

※ popularityScore が未設定のときは「今週ピック → 新着順」で表示されます。
