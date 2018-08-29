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
    this.assignUuids();
    this.assignLocalIds();
    this.pickupChildrenIds();
    this.formatIndents();
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

      // import行は無視
      else if (line.match(reImport)) {
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

      // expr行またはメモ先頭行のレベル補正処理
      else if (line.match(reExprOrMemoHeadline)) {
        // メモ先頭行は命題行に対してインデント+2にする
        if (level !== statementLevel + 2) {
          this.editor.setIndentationForBufferRow(row, statementLevel + 2);
        }
      }

      // メモ後続行は命題行に対してインデント+4.5にする
      else if (level !== statementLevel + 4.5) {
        this.editor.setIndentationForBufferRow(row, statementLevel + 4.5);
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

    // 1パス目で row => [childIds...] の情報を集める
    let childrenByRow = {};
    let level = 0;
    let rowByLevel = {};
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);

      // ()付きのexpr行の処理
      let matches = line.match(reExprParentheses);
      if (matches) {
        // childrenByRow[row]に配下外の子IDだけを入れる
        // 後の命題行の処理にて配下の子IDを追加する
        let children =
          (matches[1] === "") ? [] : matches[1].replace(/\s+/g, '').split(',');
        for (let idx = children.length - 1; idx >= 0; idx--) {
          let item = children[idx];
          if (item === "") children.splice(idx, 1);
          else if (item.match(reDirectChildId)) children.splice(idx, 1);
        }
        childrenByRow[row] = children;
        rowByLevel[level] = row;
        continue;
      }

      // 命題行の処理
      matches = line.match(reStatement);
      if (matches) {
        let localId = matches[1];
        level = this.editor.indentationForBufferRow(row);
        rowByLevel[level] = undefined; // この命題のexprはまだない

        // インデント的に親のない命題はスキップ
        let parentLevel = level - 1;
        let parentRow = rowByLevel[parentLevel];
        if (parentRow === undefined) continue;

        // 当該命題が親のexprに含まれていない場合は当該命題のローカルIDを追加
        let children = childrenByRow[parentRow];
        let negativeId = "-" + localId;
        if (children.indexOf(localId) === -1 &&
          children.indexOf(negativeId) === -1) {
          children.push(localId);
        }
        continue;
      }
    }

    // 2パス目で変更が必要なところをエディタ上で置き換える
    for (let row in childrenByRow) {
      let children = childrenByRow[row];
      let asis = this.buffer.lineForRow(row);
      let tobe = asis.replace(/\([^\)]*\)$/, '(' + children.join(', ') + ')');
      if (asis !== tobe) {
        let range = this.buffer.rangeForRow(row);
        this.buffer.setTextInRange(range, tobe);
      }
    }
  }
}

const reEmpty = /^\s*$/;
const reComment = /^\s*\/\/.*$/;
const reImport = /^import\s+"[^"]+\.sad"/;
const reStatement = /^\s*\[(\d*)\]\s*.*$/;
const reUuidEmpty = /^\s*uuid\s*$/;
const reLocalIdEmpty = /^\s*\[\].*$/;
const reExprParentheses = /^\s*expr\s+[^\(]*\(([^\)]*)\)$/;
const reDirectChildId = /^\d+$/;
const reExprOrMemoHeadline = /^\s*([^\s]{1,8})\s+[^\s](.*)\s*$/;
