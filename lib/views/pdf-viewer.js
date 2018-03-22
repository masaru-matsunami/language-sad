'use babel';
import os from 'os';
import path from 'path';
import child_process from 'child_process';
import Model from '../models/model';
import DotWriter from './dot-writer';
import Helpers from '../helpers';

class PdfViewer {
  show(model, targetId, deepLevel) {
    let targetStatement = model.findStatementById(targetId);
    if (targetStatement == null) return;

    // もし命題にlabel指定があれば、ファイル名をlabelにする
    let basename = targetId;
    let labelMemo = targetStatement.findMemo('label');
    if (labelMemo) {
      let candidate = Helpers.stripInvalidFilenameChars(labelMemo.strs[0]);
      if (candidate.length >= 1) basename = candidate;
    }

    let dotDirPath = os.tmpdir();
    let pdfDirPath = atom.config.get('language-sad.pdfPath');
    let dotPath = path.join(dotDirPath, basename + '.dot');
    let pdfPath = path.join(pdfDirPath, basename + '.pdf');
    let dotWriter = new DotWriter(dotPath);
    dotWriter.writeStatementRecursively(targetStatement, deepLevel);
    dotWriter.writer.on('finish', () => {
      dotToPdf(dotPath, pdfPath);
      if (!isSumatraPdfShowing(basename)) {
        showPdf(pdfPath);
      }
    });
  }
}

export default new PdfViewer;

// ----------------------------------------------------------------
//  private functions
// ----------------------------------------------------------------

function dotToPdf(dotPath, pdfPath) {
  try {
    let exePath = atom.config.get('language-sad.dotExePath');
    let exe = exePath.endsWith('dot.exe') ? exePath : 'dot.exe';
    let cmd = '"' + exe + '" -Tpdf "' + dotPath + '" > "' + pdfPath + '"';
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

// TODO: support other platform and pdf viewer
function isSumatraPdfShowing(basename) {
  let cmd = 'chcp 437 & tasklist /nh /v /fo csv /fi "imagename eq sumatrapdf.exe"';
  let lines = child_process.execSync(cmd, {
    encoding: 'utf8'
  }).split(/\r\n/);
  for (let idx = 1; idx < lines.length; idx++) {
    let columns = lines[idx].split(/,/);
    if (columns[0] === '"SumatraPDF.exe"' &&
      columns[9].endsWith(basename + '.pdf - SumatraPDF"')) return true;
  }
  return false;
}
