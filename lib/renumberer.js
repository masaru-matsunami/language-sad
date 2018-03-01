'use babel';

// ----------------------------------------------------------------
//  編集中バッファに対してローカルIDをrenumberingするクラス
// ----------------------------------------------------------------
export default class Renumberer {
  constructor(editor) {
    this.editor = editor;
    this.buffer = editor.getBuffer();
  }

  do() {
    // まずエラーが起きるかどうかだけ確認する
    let noError = this.renumber(false);

    // エラーがなかったので本当にローカルIDを書き換える
    if (noError) this.renumber(true);
  }

  renumber(doChange) {
    // 命題行のローカルIDのrenumbering
    let newIdByOldId = [];
    let newId = 1;
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);
      let matches = line.match(reStatement);
      if (matches) {
        // 旧ローカルID取得
        let oldId = parseInt(matches[2], 10);

        // ローカルID重複チェック
        if (newIdByOldId[oldId] !== undefined) {
          atom.notifications.addError('Duplicated id: ' + oldId);
          return false;
        }

        // 旧ローカルID → 新ローカルID の対応表を構築
        newIdByOldId[oldId] = newId;

        // 命題行を新ローカルIDで書き換える
        if (doChange) {
          line = matches[1] + newId + matches[3];
          let range = this.buffer.rangeForRow(row);
          this.buffer.setTextInRange(range, line);
        }

        // 次のために新ローカルIDをインクリメントしておく
        newId++;
      }
    }

    // expr行のローカルIDのrenumbering
    for (let row = 0; row <= this.buffer.getLastRow(); row++) {
      let line = this.buffer.lineForRow(row);
      let matches = line.match(reExprParentheses);
      if (matches) {
        let oldIds = matches[2].split(/\s*,\s*/);
        let newIds = [];
        for (let oldId of oldIds) {
          // uuidならばそのまま変更しない
          if (isNaN(oldId)) {
            newIds.push(oldId);
            continue;
          }

          // 負のID
          let negativeId = false;
          if (oldId < 0) {
            oldId = -oldId;
            negativeId = true;
          }

          // 存在しないローカルID参照チェック
          if (newIdByOldId[oldId] === undefined) {
            atom.notifications.addError('Missing id: ' + oldId);
            return false;
          }

          // idのrenumbering
          let newId = negativeId ? -newIdByOldId[oldId] : newIdByOldId[oldId];
          newIds.push(newId);
        }

        // expr行のローカルID群を新ローカルIDで書き換える
        if (doChange) {
          line = matches[1] + newIds.join(', ') + matches[3];
          let range = this.buffer.rangeForRow(row);
          this.buffer.setTextInRange(range, line);
        }
      }
    }

    // ここまできたら何もエラーがなかったということで
    return true;
  }
}

const reStatement = /(^\s*\[)(\d+)(\]\s*.*$)/;
const reExprParentheses = /(^\s*expr\s+[^\(]*\()([^\)]*)(\).*$)/;
