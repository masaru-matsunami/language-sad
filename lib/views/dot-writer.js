'use babel';
import fs from 'fs';
import util from 'util';
import Statement from '../models/statement';
import uuid from 'node-uuid';

const showMemo = true;
const statementWidth = 30; // ノード内命題テキストの1行分の半角文字数
const memoWidth = 40; // ノード下のメモテキストの1行分の半角文字数
const duplicateNode = true;
const trueColors = 'color="#0000FF", fillcolor="#EEEEFF"';
const falseColors = 'color="#FF0000", fillcolor="#FFEEEE"';
const undefColors = 'color="#808080", fillcolor="#EEEEEE"';
const trueColor = 'color="#0000FF"';
const falseColor = 'color="#FF0000"';
const undefColor = 'color="#808080"';

export default class DotWriter {
  dotPath;
  constructor(dotPath) {
    this.dotPath = dotPath;
  }
  writer;
  open() {
    this.writer = fs.createWriteStream(this.dotPath);
  }
  close() {
    this.writer.end();
  }
  writeLine(line) {
    this.writer.write(line + '\n');
  }

  writeStatementRecursively(statement) {
    this.open();
    this.writeDotHeader();

    this.writeStatement(statement);

    this.writeDotFooter();
    this.close();
  }

  writeDotHeader() {
    this.writeLine('digraph sample {');
    this.writeLine('graph [size="100,100", rankdir=LR];');
    this.writeLine('node [style=filled, fontname="MS Gothic", fontsize="12"];');
    this.writeLine('edge [dir=none];');
  }

  writeDotFooter() {
    this.writeLine('}');
  }

  writeStatement(statement, forceId = null) {
    // 命題ノードを描く
    let id = forceId ? forceId : statement.id;
    let colors;
    if (statement.value === true) colors = trueColors;
    else if (statement.value === false) colors = falseColors;
    else colors = undefColors;
    let expr = (statement.expr === undefined) ? 'undef' : statement.expr;
    this.writeLine(util.format(
      '"%s" [label="{<id>[%s]| %s |<expr>%s}", %s, shape=Mrecord];',
      id, statement.id, wrapText(statement.text, statementWidth),
      expr, colors));

    // 命題ノードのメモを描く
    if (showMemo) {
      if (statement.memos.length > 0) {
        let noteText = '';
        statement.memos.forEach(memo => {
          let text = '[' + memo.tag + '] ' + memo.strs.join(''); // TODO:無理やり連結しているのは改善必要
          text = wrapText(text, memoWidth);
          if (noteText !== '') noteText += '\\l';
          noteText += text;
        });
        this.writeLine(util.format(
          '"%s_memos" [label="%s", color="#808080", fillcolor="#FFFFFF", shape=note];',
          id, noteText
        ));
        this.writeLine(util.format('"%s" -> "%s_memos";', id, id));
        this.writeLine(util.format('{rank=same; "%s" "%s_memos"};', id, id));
      }
    }

    // 子孫ノードとの間に接続線を描き、再帰的に子孫の命題ノードを描く
    statement.children.forEach(child => {
      let childId = duplicateNode ? uuidgen() : child.id;
      let color;
      if (child.value === true) color = trueColor;
      else if (child.value === false) color = falseColor;
      else color = undefColor;
      this.writeLine(util.format('"%s":expr:e -> "%s":id:w [%s];', id, childId, color));
      if (duplicateNode) this.writeStatement(child, childId);
      else this.writeStatement(child);
    });
  }
}

function wrapText(text, widthMax) {
  let lines = [];
  let start = 0;
  while (start < text.length) {
    let lineChars = countLineChars(text, start, widthMax);
    let lineText = text.substring(start, start + lineChars);
    lines.push(lineText);
    start += lineChars;
  }
  return lines.join('\\l') + '\\l';
}

function countLineChars(text, start, widthMax) {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    // i番目の文字まで含めたwidthを計算
    let c = text.charCodeAt(start + i);
    if (0x20 <= c && c <= 0x7f) width += 1;
    else width += 2;

    // もしwidthMaxを超えていたら、i-1番目の文字までで1行とする
    if (widthMax < width) return i;
  }
  // ここに来ているということはtextがwidthMaxを超えなかったということ
  return text.length - start;
}

function uuidgen() {
  return uuid.v4();
}
