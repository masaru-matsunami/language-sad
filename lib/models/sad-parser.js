'use babel';
import Model from './model';
import Statement from './statement';

// ----------------------------------------------------------------
//  SadParser - language-sad形式のテキストをパースしてModelを生成。
// ----------------------------------------------------------------
export default class SadParser {
  constructor() {
    this.model = new Model();
  }

  parseLines(lines) {
    let statement = null;
    lines.forEach(line => {
      // コメントを削除
      line = line.replace(/\/\/.*/, '').trim();

      // 命題行
      const reHead = /^\[(\d+)\]\s*(.*)\s*$/;
      let matches = line.match(reHead);
      if (matches !== null) {
        statement = new Statement();
        statement.id = matches[1];
        statement.text = matches[2];
        this.model.addStatement(statement);
        return;
      }

      // 命題行以外は、statementが確定しているときだけ処理
      if (statement === null) return;

      // expr行(true, false, undef)
      const reExprBool = /^expr\s+(true|false|undef)$/;
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
      const reExprLogic = /^expr\s+((=|not|and|or)\(.+\))\s*$/;
      matches = line.match(reExprLogic);
      if (matches !== null) {
        statement.expr = matches[1];
        return;
      }

      // メモ行
      const reMemo = /^([^\s]{1,8})\s+([^\s].*)$/;
      matches = line.match(reMemo);
      if (matches !== null) {
        statement.memos.push({
          tag: matches[1],
          strs: [matches[2]]
        });
        return;
      }
    });
  }

  getModel() {
    this.model.updateLinks();
    this.model.updateValues();
    return this.model;
  }
}
