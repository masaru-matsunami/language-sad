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
        'sad:draw': function() {
          draw(1000); // 無限扱いできる十分大きなdeepLevel
        },
        'sad:draw1': function() {
          draw(1);
        },
        'sad:draw2': function() {
          draw(2);
        },
        'sad:draw3': function() {
          draw(3);
        },
        'sad:draw4': function() {
          draw(4);
        },
        'sad:draw5': function() {
          draw(5);
        },
        'sad:draw6': function() {
          draw(6);
        },
        'sad:draw7': function() {
          draw(7);
        },
        'sad:draw8': function() {
          draw(8);
        },
        'sad:draw9': function() {
          draw(9);
        },
        'sad:draw10': function() {
          draw(10);
        },
        'sad:indent': indent,
        'sad:outdent': outdent,
        'sad:undo': undo,
        'sad:redo': redo,
        'sad:toggleTreeNetwork': toggleTreeNetwork,
        'sad:toggleShowMemo': toggleShowMemo,
        'sad:setNodeLock': setNodeLock,
        'sad:clearNodeLock': clearNodeLock,
        'sad:renumber': renumber,
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
function draw(deepLevel) {
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
  if (statementId !== null) pdfViewer.show(model, statementId, deepLevel);
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

  // ユーザーに通知
  if (Config.treeGraph) {
    atom.notifications.addInfo("Graph: Tree");
  } else {
    atom.notifications.addInfo("Graph: Network");
  }
}

// 出力グラフにメモ出力するかしないか切り替え
function toggleShowMemo() {
  Config.showMemo = !Config.showMemo;

  // ユーザーに通知
  atom.notifications.addInfo("Show Memo: " + Config.showMemo);
}

// 出力グラフの起点ノードを固定する
function setNodeLock() {
  // アクティブエディタを取得
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor === null) return;

  // カーソル位置の命題IDを取得
  let statementId = sadEditor.cursorStatementId();
  if (statementId === null) return;

  // 命題IDが取得できたので、この命題IDでノードロックする
  Config.nodeLock = statementId;

  // ユーザーに通知
  atom.notifications.addInfo("Node Lock: " + Config.nodeLock);
}

// 出力グラフの起点ノードの固定を解除する
function clearNodeLock() {
  Config.nodeLock = undefined;

  // ユーザーに通知
  atom.notifications.addInfo("Node Lock: cleared");
}

// ローカルID振りなおし
function renumber() {
  // アクティブエディタを取得
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor === null) return;

  // ローカルID振りなおし
  sadEditor.renumber();
}
