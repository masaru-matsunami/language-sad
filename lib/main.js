'use babel';
import {
  CompositeDisposable,
  TextEditor
} from 'atom';
import SadParser from './models/sad-parser';
import pdfViewer from './views/pdf-viewer';
import SadEditor from './sad-editor';
import AutoFormatter from './auto-formatter';

export default {
  // パッケージの有効化処理
  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.editorSubscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add(
      'atom-text-editor', {
        'sad:draw': draw,
        'sad:indent': indent,
        'sad:outdent': outdent
      }));
    this.subscriptions.add(
      atom.workspace.observeActiveTextEditor((editor) => {
        // 以前のエディタ向けハンドラを解除
        this.editorSubscriptions.dispose();
        this.editorSubscriptions = new CompositeDisposable();

        // アクティブテキストエディタがあるならば、エディタ向けハンドラを割り当てる
        if (editor !== undefined) {
          this.editorSubscriptions.add(editor.onDidStopChanging(autoFormat));
          this.editorSubscriptions.add(editor.onDidChangeGrammar(autoFormat));
        }
      }));
  },

  // パッケージの無効化処理
  deactivate() {
    this.editorSubscriptions.dispose();
    this.subscriptions.dispose();
  },
};

// テキストをパースしてグラフをPDFで出力する
function draw() {
  // アクティブエディタを取得
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor === null) return;

  // カーソル位置の命題IDを取得
  let statementId = sadEditor.cursorStatementId();
  if (statementId === null) return;

  // 命題IDを指定してグラフ作成しPDFを表示
  let parser = new SadParser();
  parser.parseLines(sadEditor.getTextLines());
  let model = parser.getModel();
  if (statementId !== null) pdfViewer.show(model, statementId);
}

// インデント増やし
function indent() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) sadEditor.indent();
}

// インデント減らし
function outdent() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) sadEditor.outdent();
}

// 自動整形
function autoFormat() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) {
    let formatter = new AutoFormatter(sadEditor.editor);
    formatter.doAll();
  }
}
