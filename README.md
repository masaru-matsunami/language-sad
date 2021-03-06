# Security Analysis Diagram language package

## はじめに

language-sad は Attack Tree や セキュリティ分析図 をテキスト入力で効率よく作図できる Atom パッケージです。

[![基本的な使い方動画](https://img.youtube.com/vi/NplIk-PClbY/0.jpg)](https://www.youtube.com/watch?v=NplIk-PClbY)

セキュリティ分析図については [脅威分析研究会](https://sites.google.com/view/sigsta/) で過去に発表された資料 [「脅威分析超入門」](https://sites.google.com/site/sigstaweb/20161020) をご覧ください。

## セットアップ

- language-sad は今のところ Windows 専用です。
- Windows に以下のソフトウェアをインストールします。
  - [Graphviz](https://graphviz.gitlab.io/_pages/Download/Download_windows.html)
  - お好みの PDF Viewer
    --- [Sumatra PDF](https://www.sumatrapdfreader.org/download-free-pdf-viewer.html) を推奨。
    Adobe Reader はファイルロックするため非推奨。
- Graphvizのdot.exeコマンドのフルパスを設定します。
  - language-sad の Settings の Full path to the graphviz dot.exe command に dot.exe のフルパス（例えば C:\\Program Files (x86)\\Graphviz2.38\\bin\\dot.exe など）を指定します。
- お好みの PDF Viewer を 拡張子.pdf に割り当てます。
- セットアップ手順動画（YouTube）もあります。

  [![セットアップ手順動画](https://img.youtube.com/vi/hNMPu5c9HCQ/0.jpg)](https://youtu.be/hNMPu5c9HCQ)

## チュートリアル

まずは attack-tree.sad という名前のファイルをAtomで作成して、下記の内容をコピー＆ペーストしてください。
```
// --------------------------------------------------------
//  README用サンプルAT図
// --------------------------------------------------------
[1] 金庫を開ける
    考察  金庫を開ける方法を思いつくまま書き出す。
    expr or(2, 3, 7)
  [2] 鍵をこじ開ける
  [3] 鍵の番号を知る
      expr or(4, 5, 6)
    [4] 鍵の番号が書いてあるポストイットを探す
        expr  false
        根拠  探したけど見つからなかった。
    [5] 金庫の関係者から鍵の番号を聞き出す
    [6] 鍵の番号を推測する
        expr  true
        根拠  電話番号の下4桁を試したらビンゴだった。
  [7] 筐体を壊して開ける
      expr  false
      考察  いやいやさすがに無理でしょう。
      根拠  試したけどやっぱり駄目だった。
```
そして `[1]` の行にカーソルを置き、キーボードショートカット `CTRL+:` してください。
すると Attack Tree がPDFビューアによって表示されます。
このようにテキストを記述するだけで簡単にツリー状（またはネットワーク状）のグラフを作図することができます。

## セキュリティ分析図

language-sad はセキュリティ分析図と呼ばれる形式のグラフを作図します。
セキュリティ分析図は「モノゴト(命題)の因果関係を記述する方法」であるため、
Attack Tree 等を記述することにも使えます。

セキュリティ分析図は角丸矩形の「ノード」とノードにぶら下がる付箋矩形の「メモ」で構成されます。
メモはノードに関する説明記述です。複数の「属性」で構成されます。
属性はKey-Value形式で、ノードに関する説明を記述したものです。
Key部分は[]内に表記され、Value部分が[]の右側に表記されます。

ノードは命題を表現したものです。
ノード間の親子関係により、命題間の因果関係を表現します。子が原因、親が結果に対応します。
親子のノードは線分で結ばれ、線分の左側が親で右側が子です。
親ノードの右端には演算子(and, or, not, =)が記されています。
親ノードの真偽値はこの演算子と子ノードの真偽値により決定します。
子ノードを持たないノードは葉ノードと言い、葉ノードはその命題の真偽値を何らかの根拠を持って決定します。
その根拠は葉ノードのメモに記述します。

ノードと線分の色は命題の真偽値を次のように表現します。
- 真 … 青色
- 偽 … 赤色
- 不明 … 灰色

## テキスト書式（.sad形式）

チュートリアルでコピー＆ペーストしたテキストの書式に関する説明です。

### 命題行
[数字] 形式で始まる行は 命題行 です。1つの命題行が1つのノードとして作図されます。
[] 内の数字はその命題の識別子（ローカルID）です。[] の右側が命題の文字列です。

[] 内の数字は入力する必要はありません。
単に [] と記述し続けて命題の文を記述し改行すると自動的に数字が入力されます。
また [] 内の数字は `CTRL+r` により綺麗に先頭から振りなおしできます。

チュートリアルのテキストを見ると分かるように、命題行のインデントは命題間の親子関係を表現します。
命題行にカーソルを置いて `CTRL+]` するとインデント下げ、`CTRL+[` するとインデント上げができます。
このインデント操作は複数行を選択して行うこともできます。

### 属性行
命題行に続く [数字] 形式で始まらない行は 属性行 です。
属性行のすぐ上にある命題行のノードを説明するメモとして作図されます。
属性行は「考察  いやいやさすがに無理でしょう。」のように Key と Value をスペースで挟んで記述します。
Key 部分は任意の文字列ですが 8文字以下 である必要があり、「考察」「根拠」などが習慣的に使われます。

Value 部分は複数行に分けて記述することもできます。
複数行に分けて記述した Value は連結され1つの Value として出力されます。
ただし2行目以降の Value を記述する行では、先頭8文字以内にスペースが入らないように記述する必要があります。
また Value を複数行で記述するとき、空行は1つの Value 内の改行文字として扱われます。

Key 部分は任意の文字列と説明しましたが、いくつか組込みの Key がありますので、以下説明します。

#### expr 属性
Key が `expr` である属性は「expr属性」と言い、次のような特別な意味を持ちます。
最初の3行は葉ノード用で、残りの4行は親ノード用です。
() 内の数字は子ノードの命題行の [] 内の数字に対応します。
```
expr  true       その命題の真偽値が「真」である
expr  false      その命題の真偽値が「偽」である
expr  undef      その命題の真偽値が「不明」である
expr  and(2, 3)  その命題の真偽値が「真」になるのは、命題2と命題3が同時に「真」である場合である
expr  or(2, 3)   その命題の真偽値が「真」になるのは、命題2と命題3のいずれかが「真」である場合である
expr  not(2)     その命題の真偽値が「真」になるのは、命題2が「偽」である
expr  =(2)       その命題の真偽値が「真」になるのは、命題2が「真」である
```
() 内の数字は入力する必要はありません。
単に `expr and()` などと記述しておけば、命題行のインデントから命題間の親子関係を見つけて自動入力してくれます。
下記「グラフの分離記述と連結表示」のところに例外の説明がありますので合わせてお読みください。

#### label 属性
Key が `label` である属性は「label属性」と言います。
label行のある命題行はノードとして作図されるときに、
ノード左端に表記される識別子（ローカルID）が label行 の Value 文字列に置き換えられます。
識別子（ローカルID）は `CTRL+r` で番号が変わってしまうため、命題の識別子を固定したいときに label属性 を使います。

### コメント行
`//` で始まる行はコメント行です。単に無視され作図には影響ありません。
命題行や属性行の後半にコメントを記述することはできません。

## 使い方

### 部分グラフの表示
チュートリアルでは `[1]` 部分にカーソルを置いてから `CTRL+;` しましたので、命題 [1] を起点として作図されました。
ほかの命題の行にカーソルを置いて同様に `CTRL+;` すると、その命題を起点として作図されます。
部分木を確認したいときに便利です。
また `CTRL+;` の代わりに `CTRL-1` から `CTRL-0` により作図すると、作図するツリーの段数を1段から10段までの間で制限することができます。

### グラフ起点の固定
通常であれば `CTRL+;` すると、カーソル位置にある命題を起点として作図されます。しかしメニューの `Packages > Sad > Set Node Lock` を選択すると、そのときのカーソル位置にある命題を起点として固定します。その後 `CTRL+;` するとカーソル位置に寄らず固定した命題を起点として作図されます。`Packages > Sad > Clear Node Lock` で固定が解除されます。

### グラフの分離記述と連結表示
命題行の入れ子が複雑になってくると、見通しをよくするため小さなツリーに分離して記述したくなります。
例えば次の例では1つのツリーを2つのツリーに分離して記述した例です。
expr の () では子命題のIDを指定しますが、インデント関係では命題 [4] は命題 [1] の子命題として扱われず、[1] のexpr行の () 内から 4 が自動削除されてしまいます。
このようにインデントの関係とは無関係に参照したいIDを指定する場合は、マイナス符号を付けて expr の () 内に記述します。

```
[1] ツリーAの親
    expr  and(-4, 2, 3)
  [2] ツリーAの子X
  [3] ツリーAの子Y

[4] ツリーBのトップ
    expr  or(5, 6, 7)
  [5] ツリーBの子X
  [6] ツリーBの子Y
  [7] ツリーBの子Z
```
このような分離記述をした場合、
カーソルを`[1]`において`CTRL+;`すると、ツリーBの配下までは作図されません。
`CTRL+:`するとツリーBの配下まで連結して作図されます。
分析作業のほとんどの場面では部分木を見ながら作業をするため、
`CTRL+;`は部分木の範囲までしか作図しないようにしてあります。
`CTRL+:`は仕上げとして全体を見渡すときに使います。

### 外部ファイル参照
分析の規模が大きくなってくると、複数のファイルに分割して管理したくなります。
`import`と`uuid`によりファイル間の連携ができます。
下記の例では、ファイル`analysis.sad`から外部ファイル`common.sad`の中のノードを`lrlcahckbrhmlbxbgtrrizd6km`という`uuid`で
参照しています。`uuid`の値部分は「uuid」とタイプして改行すると自動発番されます。

```
// ---- analysis.sad ----
import "common.sad"

[1] ツリーAの親
    expr  and(lrlcahckbrhmlbxbgtrrizd6km, 2, 3)
  [2] ツリーAの子X
  [3] ツリーAの子Y
```
```
// ---- common.sad ----
[1] ツリーBのトップ
    uuid  lrlcahckbrhmlbxbgtrrizd6km
    expr  or(2, 3, 4)
  [2] ツリーBの子X
  [3] ツリーBの子Y
  [4] ツリーBの子Z
```


### メモの表示・非表示
`Packages > Sad > Toggle Show Memo`により、命題ノード下に表示されるメモ部分の表示・非表示を切り替えることができます。

### グラフ形状のツリー型とネットワーク型の切り替え
`CTRL+;` をしたときに生成されるグラフにはツリー型とネットワーク型の2つがあり、メニューの `Packages > Sad > Toggle Tree / Network` で切り替えることができます。複数の親命題から参照される子命題があるとき、ネットワーク型では子命題は1つのノードとして表現され、ツリー型では子命題は複製され表現されます。

### 折り畳み
各命題行の左端にある行番号の右にマウスカーソルを近づけると折り畳み（Folding）マークが表示されます。折り畳みマークをクリックすることでインデントの深い命題群をまとめて折り畳みができます。

### 識別子（ローカルID）の自動振りなおし
メニューの `Packages > Sad > Renumber` を選択（もしくは `CTRL+r` ）するとファイルの先頭から登場した順番で命題行に識別子（ローカルID）を振りなおします。
