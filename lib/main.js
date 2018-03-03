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
  // 設定のスキーマ定義を参照
  config: Config.settings,

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
        'sad:setNodeLock': setNodeLock,
        'sad:renumber': renumber,
      }));
    this.subscriptions.add(atom.commands.add(
      'atom-workspace', {
        'sad:toggleTreeNetwork': toggleTreeNetwork,
        'sad:toggleShowMemo': toggleShowMemo,
        'sad:toggleDrawOutsideOfTree': toggleDrawOutsideOfTree,
        'sad:clearNodeLock': clearNodeLock,
        'sad:setPdfFolder': setPdfFolder,
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
          this.editorSubscriptions.add(editor.onDidChangeCursorPosition(onDidChangeCursorPosition));
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
  // まずロックされているならその命題IDを使う
  let statementId = Config.nodeLock;
  // ロックされていない場合はカーソル位置の命題IDを使う
  if (statementId === 0) statementId = sadEditor.cursorStatementId();
  // 命題IDが決定しなかったらグラフを出力しない
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

// onDidChangeCursorPosition
function onDidChangeCursorPosition() {
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor !== null) sadEditor.onDidChangeCursorPosition();
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
  let oldType = atom.config.get('language-sad.graphType');
  let newType = oldType === 'Tree' ? 'Network' : 'Tree';
  atom.config.set('language-sad.graphType', newType);

  // ユーザーに通知
  atom.notifications.addInfo("Graph Type: " + newType);
}

// 出力グラフにメモ出力するかしないか切り替え
function toggleShowMemo() {
  let showMemo = !atom.config.get('language-sad.showMemo');
  atom.config.set('language-sad.showMemo', showMemo)

  // ユーザーに通知
  atom.notifications.addInfo("Show Memo: " + showMemo);
}

// 出力グラフにツリー配下外もグラフ出力するかしないか切り替え
function toggleDrawOutsideOfTree() {
  let drawOutsideOfTree = !atom.config.get('language-sad.drawOutsideOfTree');
  atom.config.set('language-sad.drawOutsideOfTree', drawOutsideOfTree)

  // ユーザーに通知
  atom.notifications.addInfo("Draw Outside Of Tree: " + drawOutsideOfTree);
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
  atom.notifications.addInfo("Node Lock: " + statementId);
}

// 出力グラフの起点ノードの固定を解除する
function clearNodeLock() {
  Config.nodeLock = 0;

  // ユーザーに通知
  atom.notifications.addInfo("Node Lock: Cleared");
}

// ローカルID振りなおし
function renumber() {
  // アクティブエディタを取得
  let sadEditor = SadEditor.getActiveSadEditor();
  if (sadEditor === null) return;

  // ローカルID振りなおし
  sadEditor.renumber();
}

// PDFファイルの保存フォルダを設定する
function setPdfFolder() {
  const dialog = require('electron').remote.dialog;
  let newPdfPath = dialog.showOpenDialog({
    title: 'Set PDF Folder',
    properties: ['openDirectory']
  });
  if (newPdfPath) {
    atom.config.set('language-sad.pdfPath', newPdfPath[0]);
  }
}
