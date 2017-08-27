'use babel';
import {
  TextEditor
} from 'atom';

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
    return new SadEditor(editor);
  }

  constructor(editor) {
    this.editor = editor;
    this.buffer = editor.getBuffer();
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

  getTextLines() {
    let text = this.editor.getText();
    let lines = text.split('\n');
    return lines;
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
}

const reEmpty = /^\s*$/;
const reStatement = /^\s*\[(\d+)\]\s*.*$/;
