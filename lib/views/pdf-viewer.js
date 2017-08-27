'use babel';
import os from 'os';
import path from 'path';
import child_process from 'child_process';
import Model from '../models/model';
import DotWriter from './dot-writer';

class PdfViewer {
  show(model, targetId) {
    try {
      let targetStatement = model.findStatementById(targetId);
      if (targetStatement == null) return;

      let tmpDirPath = os.tmpdir();
      let dotPath = path.join(tmpDirPath, targetId + '.dot');
      let pdfPath = path.join(tmpDirPath, targetId + '.pdf');
      let dotWriter = new DotWriter(dotPath);
      dotWriter.writeStatementRecursively(targetStatement);
      dotWriter.writer.on('finish', () => {
        dotToPdf(dotPath, pdfPath);
        showPdf(pdfPath);
      });
    } catch (e) {
      console.log(e);
    }
  }
}

export default new PdfViewer;

// ----------------------------------------------------------------
//  private functions
// ----------------------------------------------------------------

function dotToPdf(dotPath, pdfPath) {
  let cmd = 'dot -Tpdf "' + dotPath + '" > "' + pdfPath + '"';
  child_process.execSync(cmd);
}

function showPdf(pdfPath) {
  let cmd = '"' + pdfPath + '"';
  child_process.exec(cmd);
}
