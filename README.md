# オッズシティ / ODDS CITY

架空のメキシコの犯罪組織を舞台に、仕事・暮らし・人間関係と危険の中で人生を進めるブラウザーゲーム。試作中です。

## 起動

このリポジトリをダウンロードし、フォルダーで次を実行します。Python 3が必要です。Windowsではpythonをpyに置き換えて起動できる環境もあります。

```sh
python -m http.server 8766 --bind 127.0.0.1 --directory outputs
```

ブラウザーで http://127.0.0.1:8766/odds-city.html を開いてください。

セーブはブラウザー内に保存されます。GitHubに個人のセーブデータは含まれません。既存プレイを引き継ぐ場合は、利用中のブラウザー・アドレス・ポートを変えず、セーブを初期化しないでください。

## 含まれるもの

- [ゲーム本体](outputs/odds-city.html) と出生地抽選用の人口データ
- 職務と昇進、刑務所と出所後の復帰、危険対策、カジノのホールデム
- 暮らしの支出、住宅・乗り物、合法の小商いと情勢による収支
- [共通ルール](outputs/GAME_DESIGN_RULES.md)、[調査資料](outputs/RESEARCH_NOTES.md)、[引継ぎ](outputs/ODDS_CITY_HANDOFF.md)

## 独立した検証

Node.jsを使います。実ブラウザーや実セーブは操作しません。

```sh
node tools/odds-city-audit.cjs --checks-only
node tools/audit-hourly.cjs
```

後者は4方針×200人生を1回検証するコマンドで、繰り返し実行のスケジュール自体は含みません。結果はtools/audit-resultsに生成され、Gitの保存対象外です。自動方針は人間の遊び方や面白さを代替しません。

## 現在の実装と残件

[PROJECT_STATUS.md](outputs/PROJECT_STATUS.md) を参照してください。

金額・確率には研究等の参考値とゲーム用の仮定が含まれます。根拠と限界は各設計資料に記録しています。
