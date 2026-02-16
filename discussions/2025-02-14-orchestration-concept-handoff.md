# ContextGit 引き継ぎメモ：AI間オーケストレーション機能

## 背景・着想元

ものづくり太郎チャンネルの中国製造業の動画を起点に、「YouTube動画をAIで理解する方法」を議論する中で、以下の知見と着想が生まれた。

### 現状の課題
- YouTube動画の直接理解はGemini（Google）の独壇場。プラットフォームオーナーの特権。
- Claude、ChatGPT等は字幕テキスト経由でしか動画内容にアクセスできない。
- 各AIには「ホームグラウンド」がある（Gemini→Google系、Claude→長文分析・コード、ChatGPT→画像生成等）

### 発見した面白いアプローチ
Claude Code + Chrome拡張で、**Geminiの「要約」ボタンをUIレベルで操作**し、Geminiの動画理解能力をClaudeから間接的に利用する手法が存在する（Medium記事より）。

本質：**APIが公開されてないサービスでも、UIさえあればアクセスできる**

## ContextGitへの提案：AI間オーケストレーション層

### コンセプト
ContextGitの「異なるLLM間でコンテキストを共有・管理する」という既存思想に、**「タスクに応じて最適なAIを自動選択・実行する」オーケストレーション層**を追加する。

### アーキテクチャ案

```
[ユーザーのタスク]
      ↓
[ContextGit - オーケストレーター]
  ├── タスク分析：何が必要か判断
  ├── AIルーティング：最適なAIを選択
  ├── 実行：Claude in Chrome等でUI操作 or API呼び出し
  └── コンテキスト統合：結果をバージョン管理して次のAIに渡す
```

### 具体的なユースケース

1. **動画理解パイプライン**
   - 「この動画を分析して」→ ContextGitがGeminiに動画要約を依頼 → 結果をコンテキストとして保存 → Claudeが深い分析・構造化

2. **マルチAI画像生成**
   - Claude in ChromeでMidjourneyのDiscord UIを操作 → 生成画像をContextGitが管理 → 別タスクで再利用

3. **リサーチ統合**
   - Perplexityで最新情報収集 → ContextGitでコンテキスト化 → Claudeで論文風にまとめる

4. **各AIの得意領域マッピング**
   - Gemini：Google系サービス連携、動画理解、リアルタイム情報
   - Claude：長文分析、コード生成、構造化思考
   - ChatGPT：画像生成（DALL-E）、音声、プラグインエコシステム
   - Perplexity：検索特化、ソース付きリサーチ

### 実装アプローチの候補

1. **Claude Code + Chrome拡張ベース**（短期的に実現可能）
   - Claude in Chromeで他AIのWeb UIを操作するSkill/Commandを作成
   - 結果をContextGitのリポジトリに自動保存

2. **MCP（Model Context Protocol）ベース**（中長期）
   - 各AIサービスをMCPサーバーとして抽象化
   - ContextGitがMCPクライアントとして統合管理

3. **ハイブリッド**
   - API利用可能なものはAPI経由、不可能なものはUI操作で対応

## 議論のポイント（Claude Codeで深掘りしたい）

- ContextGitの既存アーキテクチャにどう組み込むか
- AI選択ルーティングのロジック設計
- コンテキストのバージョン管理と各AI間の受け渡しフォーマット
- セキュリティ・認証情報の管理方法
- 最初に作るべきMVP的な機能は何か
