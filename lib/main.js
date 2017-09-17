'use babel';
import {
  CompositeDisposable,
  TextEditor
} from 'atom';
import pdfViewer from './views/pdf-viewer';
import SadEditor from './sad-editor';
import Model from './models/model';
import Config from './config';

export default {
  // パッケージの有効化処理
  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.editorSubscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add(
      'atom-text-editor', {
        'sad:draw': draw,
        'sad:indent': indent,
        'sad:outdent': outdent,
        'sad:undo': undo,
        'sad:redo': redo,
        'sad:toggleTreeNetwork': toggleTreeNetwork,
        'sad:toggleNodeLock': toggleNodeLock
      }));
    this.subscriptions.add(
      atom.workspace.observeActiveTextEditor((editor) => {
        // 以前のエディタ向けハンドラを解除
        this.editorSubscriptions.dispose();
        this.editorSubscriptions = new CompositeDisposable();

        // アクティブテキストエディタがあるならば、エディタ向けハンドラを割り当てる
        if (editor !== undefined) {
          this.editorSubscriptions.add(editor.onDidStopChanging(onDidStopChanging));
          this.editorSubscriptions.add(editor.onDidChangeGrammar(onDidChangeGrammar));
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

  // 起点となる命題IDを決定する
  let statementId = Config.nodeLock; // ロックされているならその命題IDを使う
  if (statementId === undefined) {
    // ロックされていないのでカーソル位置の命題IDを取得
    statementId = sadEditor.cursorStatementId();
  }
  if (statementId === null) return;

  // 命題IDを指定してグラフ作成しPDFを表示
  let text = sadEditor.editor.getText();
  let model = Model.createFromText(text);
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

// onDidStopChanging
function onDidStopChanging() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) sadEditor.onDidStopChanging();
}

// onDidChangeGrammar
function onDidChangeGrammar() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) sadEditor.onDidChangeGrammar();
}

// Undo
function undo() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) sadEditor.undo();
}

// Redo
function redo() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) sadEditor.redo();
}

// 出力グラフのツリーとネットワークの切り替え
function toggleTreeNetwork() {
  Config.treeGraph = !Config.treeGraph;

  // 状態変化をユーザーに通知する
  // TODO:適切なUI表現に変更
  if (Config.treeGraph) {
    console.log("Graph: Tree");
  } else {
    console.log("Graph: Network");
  }
}

// 出力グラフの起点ノードを固定するかしないか切り替え
function toggleNodeLock() {
  try {
    // ノードロックされていた場合は解除する
    if (Config.nodeLock !== undefined) {
      Config.nodeLock = undefined;
      return;
    }

    // アクティブエディタを取得
    let sadEditor = SadEditor.getActiveSadEditor();
    if (sadEditor === null) return;

    // カーソル位置の命題IDを取得
    let statementId = sadEditor.cursorStatementId();
    if (statementId === null) return;

    // 命題IDが取得できたので、この命題IDでノードロックする
    Config.nodeLock = statementId;

  } finally {
    // 状態変化をユーザーに通知する
    // TODO:適切なUI表現に変更
    if (Config.nodeLock === undefined) {
      console.log("Node Lock: cleared");
    } else {
      console.log("Node Lock: " + Config.nodeLock);
    }
  }
}
