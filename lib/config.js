'use babel';
import os from 'os';

export default class Config {
  static treeGraph = true;
  static showMemo = true;
  static nodeLock = undefined;

  // 設定のスキーマ定義
  static settings = {
    // PDFファイル保存フォルダ。無指定ならテンポラリディレクトリに保存。
    pdfPath: {
      type: 'string',
      default: os.tmpdir(),
      title: 'PDF file generation folder. Set from menu: Packages > Sad > Set PDF Folder',
      order: 1
    },
  }
}
