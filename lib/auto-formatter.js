'use babel';
import Helpers from './helpers';

// ----------------------------------------------------------------
//  編集中バッファに対して変更操作する自動整形クラス
// ----------------------------------------------------------------
export default class AutoFormatter {
  constructor(editor) {
    this.editor = editor;
    this.buffer = editor.getBuffer();
  }

  doAll() {
    this.formatIndents();
    this.assignUuids();
    this.assignLocalIds();
    this.pickupChildrenIds();
  }

  formatIndents() {
    let statementLevelAdjustment = undefined;
    let statementLevel = 0;
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);
      let level = this.editor.indentationForBufferRow(row);

      // 空行とコメント行は無視
      if (line.match(reEmpty) || line.match(reComment)) {
        statementLevelAdjustment = undefined; // リフトアップ道連れ停止
      }

      // 命題行のレベルの補正処理
      else if (line.match(reStatement)) {

        // この命題行がリフトアップ道連れの対象でない場合は、リフトアップ道連れ停止
        if (statementLevelAdjustment !== undefined)
          if (level < statementLevelAdjustment.beginLevel)
            statementLevelAdjustment = undefined;

        // この命題行の正しいレベルを決定する
        let adjustedLevel = level;
        if (statementLevelAdjustment !== undefined) {
          // 上側の連続行にリフトアップした命題行があれば
          // 相対的にこの命題行もリフトアップする
          adjustedLevel = level + statementLevelAdjustment.levelOffset;
        } else if (statementLevel + 1 < level) {
          // この命題行のレベルが急に深くなる場合はレベルを+1までリフトアップする
          adjustedLevel = statementLevel + 1;

          // この命題行以降の命題行も道連れにリフトアップする
          statementLevelAdjustment = {
            beginLevel: level,
            levelOffset: adjustedLevel - level
          };
        }

        // 命題行のレベルを変更する必要があるときだけインデントを変更する
        if (adjustedLevel !== level) {
          this.editor.setIndentationForBufferRow(row, adjustedLevel);
        }

        // この命題行のレベルを覚える
        statementLevel = adjustedLevel;
      }

      // 属性行は命題行に対してインデント+2にする
      else if (level !== statementLevel + 2) {
        this.editor.setIndentationForBufferRow(row, statementLevel + 2);
      }
    }
  }

  assignUuids() {
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);
      if (line.match(reUuidEmpty)) {
        line = line.replace(/uuid\s*$/, "uuid  " + Helpers.shortUuid());
        let range = this.buffer.rangeForRow(row);
        this.buffer.setTextInRange(range, line);
      }
    }
  }

  assignLocalIds() {
    // ローカルIDの最大値を調べる
    let maxLocalId = 0;
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);
      let matches = line.match(reStatement);
      if (matches) {
        let newLocalId = parseInt(matches[1], 10);
        if (newLocalId > maxLocalId) maxLocalId = newLocalId;
      }
    }

    // []を見つけたらローカルIDをインクリメントして付与する
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);
      if (line.match(reLocalIdEmpty)) {
        maxLocalId = maxLocalId + 1;
        line = line.replace(/\[\]/, "\[" + maxLocalId + "\]");
        let range = this.buffer.rangeForRow(row);
        this.buffer.setTextInRange(range, line);
      }
    }
  }

  pickupChildrenIds() {
    let statementLevel = 0;
    let exprs = [];
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);

      // ()付きのexpr行の処理
      let matches = line.match(reExprParentheses);
      if (matches) {
        let children =
          (matches[1] === "") ? [] : matches[1].replace(/\s+/g, '').split(',');
        exprs[statementLevel] = {
          row: row,
          line: line,
          children: children
        };
        continue;
      }

      // 命題行の処理
      matches = line.match(reStatement);
      if (matches) {
        let localId = matches[1];
        statementLevel = this.editor.indentationForBufferRow(row);

        // この命題のexprはまだ見つかっていなのでクリア
        delete exprs[statementLevel];

        // インデント的に親のない命題はスキップ
        let parentStatementExpr = exprs[statementLevel - 1];
        if (parentStatementExpr === undefined) continue;

        // 当該命題が親のexprに含まれていない場合は当該命題のローカルIDを追加
        if (parentStatementExpr.children.indexOf(localId) === -1) {
          parentStatementExpr.children.push(localId);
          parentStatementExpr.line = parentStatementExpr.line.replace(
            /\([^\)]*\)$/,
            '(' + parentStatementExpr.children.join(', ') + ')');
          let range = this.buffer.rangeForRow(parentStatementExpr.row);
          this.buffer.setTextInRange(range, parentStatementExpr.line);
        }
        continue;
      }
    }
  }
}

const reEmpty = /^\s*$/;
const reComment = /^\s*\/\/.*$/;
const reStatement = /^\s*\[(\d*)\]\s*.*$/;
const reUuidEmpty = /^\s*uuid\s*$/;
const reLocalIdEmpty = /^\s*\[\].*$/;
const reExprParentheses = /^\s*expr\s+[^\(]*\(([^\)]*)\)$/;
