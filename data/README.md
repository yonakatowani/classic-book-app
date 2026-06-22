# 作品データの育て方

作品データは library.js に集約しています。UIの見た目や操作コードを触らず、ここへ作品を追加・更新できます。

## 収録の段階

1. 目録：title、author
2. 詳細：summary、authorBio、openingText、recommendation
3. 試し読み：readerTexts と readerSources

まずは目録として追加し、反応がよい作品から詳細と試し読みを育ててください。

## 注意

- 海外作品は訳文の権利があるため、許諾・利用条件が明確な本文だけを readerTexts へ収録します。
- 青空文庫由来の本文には readerSources を設定し、出典を残します。
- title は履歴との照合に使うため、変更する場合は既存利用者への影響を確認してください。
