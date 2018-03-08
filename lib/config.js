'use babel';
import os from 'os';

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
      default: 30,
      title: 'Statement Width',
      order: 12,
    },

    // ノード下のメモテキストの1行分の半角文字数
    memoWidth: {
      type: 'integer',
      default: 45,
      title: 'Memo Width',
      order: 13,
    },

    // PDFファイル保存フォルダ。無指定ならテンポラリディレクトリに保存。
    pdfPath: {
      type: 'string',
      default: os.tmpdir(),
      title: 'PDF file generation folder. Set from menu: Packages > Sad > Set PDF Folder',
      order: 20,
    },
  }
}
