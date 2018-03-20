'use babel';
import Model from './model';
import Statement from './statement';

// ----------------------------------------------------------------
//  SadParser - language-sad形式のテキストをパースしてModelを生成。
// ----------------------------------------------------------------
export default class SadParser {
  constructor(model) {
    this.model = model;
  }

  parseText(text) {
    let lines = text.split('\n');
    this.parseLines(lines);
  }

  parseLines(lines) {
    let statement = null;
    let memo = null;
    let memoLineBreaked = false;

    lines.forEach(line => {

      // コメント行を削除
      const reComment = /^\s*(\/\/.*)/; // 最後に改行があるケースを配慮して$なし
      if (line.match(reComment)) return;

      // 命題行
      const reHead = /^\s*\[(\d+)\]\s*(.*)\s*$/;
      let matches = line.match(reHead);
      if (matches !== null) {
        statement = new Statement();
        statement.id = matches[1];
        statement.text = matches[2];
        this.model.addStatement(statement);
        memo = null;
        return;
      }

      // 命題行以外は、statementが確定しているときだけ処理
      if (statement === null) return;

      // expr行(true, false, undef)
      const reExprBool = /^\s+expr\s+(true|false|undef)\s*$/;
      matches = line.match(reExprBool);
      if (matches !== null) {
        switch (matches[1]) {
          case 'true':
            statement.expr = true;
            return;
          case 'false':
            statement.expr = false;
            return;
          case 'undef':
            statement.expr = undefined;
            return;
        }
      }

      // expr行(=, not, and, or)
      const reExprLogic = /^\s+expr\s+(=|not|and|or)\(([^\)]+)\)\s*$/;
      matches = line.match(reExprLogic);
      if (matches !== null) {
        statement.expr = matches[1];
        statement.childIds = matches[2].replace(/\s/g, '').split(',');
        // expr or(,,,,)のようにカンマ連続するとできる空IDを削除
        for (let idx = statement.childIds.length - 1; idx >= 0; idx--) {
          if (statement.childIds[idx] === "") statement.childIds.splice(idx, 1);
        }
        return;
      }

      // メモ先頭行
      const reMemoHeadline = /^\s+([^\s]{1,8})\s+([^\s].*)\s*$/;
      matches = line.match(reMemoHeadline);
      if (matches !== null) {
        memo = {
          tag: matches[1],
          strs: [matches[2]]
        };
        statement.memos.push(memo);
        memoLineBreaked = false;
        return;
      }

      // メモ後続行
      if (memo === null) return; // メモ先頭行がない場合
      line = line.trim();
      if (line == "") {
        memoLineBreaked = true;
      } else if (memoLineBreaked) {
        memo.strs.push(line);
        memoLineBreaked = false;
      } else {
        let lastStr = memo.strs.pop();
        memo.strs.push(lastStr + line);
      }
    });
  }
}
