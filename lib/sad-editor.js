'use babel';
import {
  TextEditor
} from 'atom';
import AutoFormatter from './auto-formatter';
import Renumberer from './renumberer';

// ----------------------------------------------------------------
//  SadEditor
// ----------------------------------------------------------------
export default class SadEditor {
  // アクティブエディタのgrammarがsadのときアクティブエディタを返す。
  // そうでない場合はnullを返す。
  static getActiveSadEditor() {
    let editor = atom.workspace.getActiveTextEditor();
    if (!(editor instanceof TextEditor)) return null;
    if ("source.sad" !== editor.getGrammar().scopeName) return null;
    if (editor.sadEditor === undefined)
      editor.sadEditor = new SadEditor(editor);
    return editor.sadEditor
  }

  constructor(editor) {
    this.editor = editor;
    this.buffer = editor.getBuffer();
    this.suppressAutoFormat = false;
    this.cursorRow = editor.getCursorBufferPosition().row;
  }

  statementInfoByRow(row) {
    let info = {
      byRow: row
    };

    // 命題行を探す
    for (let r = row; r >= 0; r--) {
      let line = this.buffer.lineForRow(r);

      // 空行に出会ったら命題定義ではない
      if (line.match(reEmpty)) break;

      // 命題行に出会ったらinfoに情報を保存する
      let matches = line.match(reStatement);
      if (matches) {
        info.localId = matches[1];
        info.firstRow = r;
        break;
      }
    }
    if (info.firstRow === undefined) return null;

    // 属性行の範囲を調べる
    info.lastRow = info.firstRow;
    for (let r = info.firstRow + 1; r <= this.buffer.getLastRow(); r++) {
      let line = this.buffer.lineForRow(r);

      // 空行または命題行に出会ったら属性行は終わり
      if (line.match(reEmpty)) break;
      if (line.match(reStatement)) break;

      // lineは属性行だったのでinfo.lastRowを更新
      info.lastRow = r;
    }

    return info;
  }

  selectStatementBlockByRow(row) {
    // 指定行が命題に所属するかどうか調べる
    let statementInfo = this.statementInfoByRow(row);
    if (statementInfo === null) return;

    // 属性行を含めた命題の範囲を選択する
    let firstRange = this.buffer.rangeForRow(statementInfo.firstRow);
    let lastRange = this.buffer.rangeForRow(statementInfo.lastRow);
    let range = firstRange.union(lastRange);
    this.editor.setSelectedBufferRange(range);
  }

  cursorStatementId() {
    let statementInfo = this.statementInfoByRow(
      this.editor.getCursorBufferPosition().row);
    if (statementInfo === null) return null;
    return statementInfo.localId;
  }

  indent() {
    // 選択範囲が長さゼロときカーソルのある命題行とすべての属性行を選択する
    if (this.editor.getSelectedText().length === 0) {
      let cursorRow = this.editor.getCursorBufferPosition().row;
      this.selectStatementBlockByRow(cursorRow);
    }

    // 標準エディタのインデント処理を呼び出す
    this.editor.indentSelectedRows();
  }

  outdent() {
    // 選択範囲が長さゼロときカーソルのある命題行とすべての属性行を選択する
    if (this.editor.getSelectedText().length === 0) {
      let cursorRow = this.editor.getCursorBufferPosition().row;
      this.selectStatementBlockByRow(cursorRow);
    }

    // 標準エディタのインデント処理を呼び出す
    this.editor.outdentSelectedRows();
  }

  undo() {
    // 標準のUndo処理を呼び出す
    this.buffer.undo();

    // Undo後またはRedo後は自動整形しない
    this.suppressAutoFormat = true;
  }

  redo() {
    // 標準のRedo処理を呼び出す
    this.buffer.redo();

    // Undo後またはRedo後は自動整形しない
    this.suppressAutoFormat = true;
  }

  onDidStopChanging() {
    // Undo直後またはRedo直後にもonDidStopChanging()が1回呼ばれるので、
    // 自動整形せずにsuppressAutoFormatをクリアしておく
    if (this.suppressAutoFormat) {
      this.suppressAutoFormat = false;
      return;
    }

    // 自動整形する
    this.autoFormat();
  }

  onDidChangeGrammar() {
    // 自動整形する
    this.autoFormat();
  }

  onDidChangeCursorPosition() {
    // 自動整形する
    this.autoFormat();
  }

  autoFormat() {
    // カーソルが同じ行にいる間の編集は無視する
    let row = this.editor.getCursorBufferPosition().row;
    if (row == this.cursorRow) return;
    this.cursorRow = row;

    // doAll()を1回のUndoで戻せるように1つのtransactionにまとめる
    let formatter = new AutoFormatter(this.editor);
    this.buffer.transact(function() {
      formatter.doAll();
    });

    // autoFormat()自身によるonDidChanging()を抑制する
    this.suppressAutoFormat = true;
  }

  renumber() {
    // do()を1回のUndoで戻せるように1つのtransactionにまとめる
    let renumberer = new Renumberer(this.editor);
    this.buffer.transact(function() {
      renumberer.do();
    });
  }
}

const reEmpty = /^\s*$/;
const reStatement = /^\s*\[(\d+)\]\s*.*$/;
