'use babel';
import os from 'os';
import child_process from 'child_process';

export default class Config {
  // 永続性を持たせないパラメータ
  static nodeLock = 0; // 0: Cleared
  static drawOutsideOfTree = false;

  // 設定のスキーマ定義
  static settings = {
    // グラフタイプ
    graphType: {
      type: 'string',
      default: 'Tree',
      enum: ['Tree', 'Network'],
      title: 'Graph Type',
      order: 10,
    },

    // メモ表示
    showMemo: {
      type: 'boolean',
      default: true,
      title: 'Show Memo',
      order: 11,
    },

    // ノード内命題テキストの1行分の半角文字数
    statementWidth: {
      type: 'integer',
      default: 20,
      title: 'Statement Width',
      order: 12,
    },

    // ノード内命題テキストのフォントサイズ
    statementFontSize: {
      type: 'integer',
      default: 12,
      title: 'Statement Font Size',
      order: 13,
    },

    // ノード下のメモテキストの1行分の半角文字数
    memoWidth: {
      type: 'integer',
      default: 30,
      title: 'Memo Width',
      order: 14,
    },

    // ノード内命題テキストのフォントサイズ
    memoFontSize: {
      type: 'integer',
      default: 10,
      title: 'Memo Font Size',
      order: 15,
    },

    // PDFファイル保存フォルダ。無指定ならテンポラリディレクトリに保存。
    pdfPath: {
      type: 'string',
      default: os.tmpdir(),
      title: 'PDF file generation folder. Set from menu: Packages > Sad > Set PDF Folder',
      order: 20,
    },

    // dot.exe
    dotExePath: {
      type: 'string',
      default: findDotExe(),
      title: 'Full path to the graphviz dot.exe command',
      order: 21,
    },
  }
}

function findDotExe() {
  try {
    let cmd = 'where dot.exe'
    let found1st = child_process.execSync(cmd, {
      encoding: 'utf8'
    }).split(/\r\n/)[0];
    return found1st.endsWith('dot.exe') ? found1st : '';
  } catch (e) {
    return '';
  }
}
