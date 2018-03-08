'use babel';
import fs from 'fs';
import util from 'util';
import Statement from '../models/statement';
import Helpers from '../helpers';
import Config from '../config';

const trueColors = 'color="#0000FF", fillcolor="#EEEEFF"';
const falseColors = 'color="#FF0000", fillcolor="#FFEEEE"';
const undefColors = 'color="#808080", fillcolor="#EEEEEE"';
const trueColor = 'color="#0000FF"';
const falseColor = 'color="#FF0000"';
const undefColor = 'color="#808080"';

export default class DotWriter {
  dotPath;
  writternStatements;
  constructor(dotPath) {
    this.dotPath = dotPath;
    this.writtenStatements = [];
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

  writeStatementRecursively(statement, deepLevel) {
    this.open();
    this.writeDotHeader();

    let opts = {
      deepLevel: deepLevel,
      forceId: null,
      graphType: atom.config.get('language-sad.graphType'),
      showMemo: atom.config.get('language-sad.showMemo'),
      statementWidth: atom.config.get('language-sad.statementWidth'),
      statementFontSize: atom.config.get('language-sad.statementFontSize'),
      memoWidth: atom.config.get('language-sad.memoWidth'),
      memoFontSize: atom.config.get('language-sad.memoFontSize'),
    };
    this.writeStatement(statement, opts);

    this.writeDotFooter();
    this.close();
  }

  writeDotHeader() {
    this.writeLine('digraph sample {');
    this.writeLine('graph [size="100,100", rankdir=LR, splines=polyline];');
    this.writeLine('node [style=filled, fontname="MS Gothic"];');
    this.writeLine('edge [dir=none];');
  }

  writeDotFooter() {
    this.writeLine('}');
  }

  writeStatement(statement, opts) {
    // ネットワークグラフのときは、同じ命題を2回以上出力しない
    if (opts.graphType === 'Network') {
      if (this.writtenStatements.indexOf(statement) !== -1) {
        // すでに出力していた
        return;
      }
    }
    // 出力済みとして登録（この後出力するんだけど）
    this.writtenStatements.push(statement);

    // labelとtypeの確認
    let label = statement.id;
    let type = undefined;
    let memos = statement.memos.slice(); // copy array by value
    for (let idx = memos.length - 1; idx >= 0; idx--) {
      let tag = memos[idx].tag;
      if (tag === "label") {
        label = memos[idx].strs[0];
        memos.splice(idx, 1);
      } else if (tag === "type") {
        type = memos[idx].strs[0];
        memos.splice(idx, 1);
      }
    }
    label = "[" + escapeLabel(label) + "]";
    if (type) label = label + "\\n(" + escapeLabel(type) + ")";

    // 命題ノードを描く
    let id = opts.forceId ? opts.forceId : statement.id;
    let colors;
    if (statement.value === true) colors = trueColors;
    else if (statement.value === false) colors = falseColors;
    else colors = undefColors;
    let expr = statement.value === undefined ? 'undef' : statement.value;
    if (/and|or|not|=/.test(statement.expr)) expr = statement.expr + "\\n(" + expr + ")";
    this.writeLine(util.format(
      '"%s" [label="{<id>%s| %s |<expr>%s}", %s, shape=Mrecord, fontsize="%d"];',
      id, label, wrapText(statement.text, opts.statementWidth),
      expr, colors, opts.statementFontSize));

    // 命題ノードのメモを描く
    if (opts.showMemo) {
      if (memos.length > 0) {
        let noteText = '';
        memos.forEach(memo => {
          let tagText = '[' + memo.tag + '] ';
          let tagWidth = textWidth(tagText);
          let indentWidth = tagWidth > 7 ? 7 : tagWidth;
          let indentText = "       ".substring(0, indentWidth);

          let text = wrapText(tagText + memo.strs[0], opts.memoWidth, indentText);
          for (let i = 1; i < memo.strs.length; i++) {
            text = text + wrapText(indentText + memo.strs[i], opts.memoWidth, indentText);
          }

          if (noteText !== '') noteText += '\\l';
          noteText += text;
        });
        this.writeLine(util.format(
          '"%s_memos" [label="%s", color="#808080", fillcolor="#FFFFFF", shape=note, fontsize="%d"];',
          id, noteText, opts.memoFontSize));
        this.writeLine(util.format('"%s" -> "%s_memos";', id, id));
        this.writeLine(util.format('{rank=same; "%s" "%s_memos"};', id, id));
      }
    }

    // deepLevel>1であれば子ノードを描く
    if (opts.deepLevel > 1) {

      // 子孫ノードとの間に接続線を描き、再帰的に子孫の命題ノードを描く
      for (let idx = 0; idx < statement.children.length; idx++) {
        let childOpts = Object.assign({}, opts);
        let child = statement.children[idx];
        let exprChildId = statement.childIds[idx];

        // ツリー配下外を描画しない場合は孫ノードを描画しないようにする
        childOpts.deepLevel = opts.deepLevel - 1;
        if (!Config.drawOutsideOfTree && exprChildId.startsWith("-")) {
          childOpts.deepLevel = 1;
          childOpts.showMemo = false; // さらにメモも描画しない
        }

        // 子ノードのノードIDを決定
        let childId = child.id;
        if (opts.graphType === 'Tree') {
          childId = Helpers.shortUuid();
          childOpts.forceId = childId;
        }

        // 子ノードの色を決定
        let color = undefColor;
        if (child.value === true) color = trueColor;
        else if (child.value === false) color = falseColor;

        // 子ノードへの接続線を描画
        this.writeLine(util.format('"%s":expr:e -> "%s":id:w [%s];', id, childId, color));

        // 子ノードを描画
        this.writeStatement(child, childOpts);
      }
    }
  }
}

function wrapText(text, widthMax, indent = "") {
  let lines = [];
  while (text.length > 0) {
    // 2行目以降はインデントを入れる
    if (lines.length > 0) text = indent + text;

    // 1行取り出す
    let line = cutLine(text, widthMax);
    lines.push(escapeLabel(line));
    text = text.substring(line.length).trim();
  }
  return lines.join('\\l') + '\\l';
}

function cutLine(text, widthMax) {
  if (text.length == 0) return;
  let chars = 0;
  let width = 0;
  while (true) {
    // 1文字取り出してwidthを計算
    let c = text.charCodeAt(chars);
    chars++;
    width++;
    if (c >= 0x80) width++;

    // ループ終了条件の確認
    if (width == widthMax) break; // ピッタリなのでループ終了
    if (width > widthMax) { // 1文字多すぎたので1文字減らしてループ終了
      chars--;
      break;
    }
  }
  return text.substring(0, chars);
}

function textWidth(text) {
  let width = 0;
  let chars = 0;
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);
    width++;
    if (c >= 0x80) width++;
  }
  return width;
}

// TODO: REMOVE
function calcIndentWidth(text, widthMax = 7) {
  let width = 0;
  let chars = 0;
  for (let i = 0; width < widthMax; i++) {
    let c = text.charCodeAt(i);
    width++;
    if (c >= 0x80) width++;
    if (c == 0x20) break; // インデント区切りなのでループ終了
  }
  return width > widthMax ? widthMax : width;
}

function escapeLabel(text) {
  return text.replace(/[\"\|\\\{\}\<\>]/g, function(match) {
    return {
      '"': '\\"',
      '|': '\\|',
      '\\': '\\\\',
      '{': '\\{',
      '}': '\\}',
      '<': '\\<',
      '>': '\\>',
    }[match]
  });
}
