'use babel';
import os from 'os';
import path from 'path';
import child_process from 'child_process';
import Model from '../models/model';
import DotWriter from './dot-writer';

class PdfViewer {
  show(model, targetId, deepLevel) {
    let targetStatement = model.findStatementById(targetId);
    if (targetStatement == null) return;

    let tmpDirPath = os.tmpdir();
    let dotPath = path.join(tmpDirPath, targetId + '.dot');
    let pdfPath = path.join(tmpDirPath, targetId + '.pdf');
    let dotWriter = new DotWriter(dotPath);
    dotWriter.writeStatementRecursively(targetStatement, deepLevel);
    dotWriter.writer.on('finish', () => {
      dotToPdf(dotPath, pdfPath);
      showPdf(pdfPath);
    });
  }
}

export default new PdfViewer;

// ----------------------------------------------------------------
//  private functions
// ----------------------------------------------------------------

function dotToPdf(dotPath, pdfPath) {
  try {
    let cmd = 'dot -Tpdf "' + dotPath + '" > "' + pdfPath + '"';
    child_process.execSync(cmd);
  } catch (e) {
    // 例外をユーザーに通知
    atom.notifications.addError("Unable to generate a PDF file.", {
      description: "Try the followings.\n" +
        "* Ensure PATH to the dot command.\n" +
        "* Close a PDF viewer."
    });
  }
}

function showPdf(pdfPath) {
  let cmd = '"' + pdfPath + '"';
  child_process.exec(cmd);
}
