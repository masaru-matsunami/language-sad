# Security Analysis Diagram language package

## はじめに

language-sad はセキュリティ分析図（Security Analysis Diagram）の作成を支援するAtomパッケージです。
まだ実験的で完成度は低いものです。セキュリティ分析図については [脅威分析研究会](https://sites.google.com/view/sigsta/) で過去に発表された資料 [「脅威分析超入門」](https://sites.google.com/site/sigstaweb/20161020) をご覧ください。

## 事前準備

language-sad は今のところ Windows 専用です。
事前に [graphviz](http://www.graphviz.org/) と PDFビューアがインストールされている必要があります。
graphviz の dot.exe にはパスを通しておく必要もあります。
language-sad はセキュリティ分析図のPDFファイルを生成し、拡張子.pdfに割り当てられたPDFビューアに表示させます。
PDFビューアは任意ですが [SumatraPDF](https://www.sumatrapdfreader.org/download-free-pdf-viewer.html) が表示が高速であるためお勧めです。

## チュートリアル

language-sadは拡張子が .sad のテキストファイルからセキュリティ分析図を生成します。
まずは test.sad という名前のファイルをAtomで作成して、下記の内容をコピー＆ペーストしてください。
```
[1] 第三者はスマホ対応金庫システムを解錠できない
    expr  not(2)
    考察  いきなり「第三者が金庫を解錠できない」ことを説明するのは難しいので、まずは攻撃者視点に切り替えてみる。
    方針  攻撃者視点に切り替える。

  [2] 第三者はスマホ対応金庫システムを解錠できる
      expr  or(3, 4)
      考察  ユーザーだけが利用を許可されている「金庫を解錠する」という「機能」がある。
      方針  攻撃者が「機能」を利用する手段は「IFを操作する方法」と「構成要素を操作する方法」の2つの手段がある。

    [3] 第三者はスマホ対応金庫システムを解錠できる／IFを操作して
        expr  true

    [4] 第三者はスマホ対応金庫システムを解錠できる／構成要素を操作して
        expr  false
```
そして `[1]` の行にカーソルを置き、キーボードショートカット `CTRL+;` してください。するとセキュリティ分析図のPDFが生成され、PDFビューアによって表示されます。

## .sad ファイルの書式

[数字]形式の行は **命題行** です。
[]内の数字がその命題の識別子（ローカルID）、[]の右側にある文字列が命題の表現する内容です。

命題行に続く[で始まらない行は **属性行** です。
属性行は Key-Value 形式で記述される行です。
属性行はその命題について詳しく説明する情報を記述します。自由形式ですが「考察」「根拠」などが習慣的に使われます。

属性行の Key が **expr** であるときだけ、その行は **expr行** と呼び、次の特別な意味を持ちます。
```
expr  true       その命題の真偽値が「真」である
expr  false      その命題の真偽値が「偽」である
expr  undef      その命題の真偽値が「不明」である
expr  and(2, 3)  その命題の真偽値が「真」になるのは、命題2と命題3が同時に「真」である場合である
expr  or(2, 3)   その命題の真偽値が「真」になるのは、命題2と命題3のいずれかが「真」である場合である
expr  not(2)     その命題の真偽値が「真」になるのは、命題2が「偽」である
expr  =(2)       その命題の真偽値が「真」になるのは、命題2が「真」である
```

## 使い方

### 部分グラフの表示

チュートリアルでは`[1]`部分にカーソルを置いてから`CTRL+;`しましたので、命題[1]をルートとしてグラフが生成されました。
ほかの命題の行にカーソルを置いて同様に`CTRL+;`すると、その命題をルートとしてグラフが生成されます。
部分グラフを確認したいときに便利です。

### IDの自動発番

`[`とタイプすると自動的に`[5]`のようにIDが自動入力されます。

### インデント

`CTRL+[`または`CTRL+]`でインデントの増減を制御できます。
命題行または属性行に（範囲選択せずに）カーソルを置いた状態で`CTRL+[`または`CTRL+]`すると、該当する命題行と付属する属性行すべてをまとめてインデント制御できます。

### 折り畳み

各命題行の左端にある行番号の右にマウスカーソルを近づけると折り畳み（Folding）マークが表示されます。折り畳みマークをクリックすることでインデントの深い命題群をまとめて折り畳みができます。

### exprの()内IDの自動挿入

次の例を入力しようとすると、親命題のand()のカッコ内に自動的に 2, 3 が挿入されます。一階層下に位置付けられた命題のIDが自動追加されます。
```
[1] 親命題
  expr and()
  [2] 子命題１
  [3] 子命題２
```

## コミュニティ

下記のGoogleグループにて雑談しています。
* https://groups.google.com/d/forum/language-sad
