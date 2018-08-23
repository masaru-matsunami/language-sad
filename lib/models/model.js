'use babel';
import SadParser from './sad-parser';
import Statement from './statement';
import SadEditor from '../sad-editor';
import path from 'path';
import fs from 'fs';

export default class Model {
  filepath;
  sadText;
  statements = [];
  models = [];

  constructor(filepath) {
    this.filepath = filepath;

    let sadEditor = SadEditor.findSadEditor(filepath);
    if (sadEditor) sadText = sadEditor.editor.getText();
    else sadText = fs.readFileSync(filepath, 'utf8');

    let parser = new SadParser(this);
    parser.parseText(sadText);
    this.updateStatements();
    this.updateLinks();
    this.updateValues();
  }
  findStatementById(id) {
    if (id.length === 26) {
      return this.findStatementByUuid(id);
    } else {
      return this.findStatementByLocalId(id);
    }
  }
  findStatementByLocalId(id) {
    for (let i = 0; i < this.statements.length; i++) {
      let statement = this.statements[i];
      if (statement.id === id) return statement;
    }
    return null;
  }
  findStatementByUuid(uuid) {
    for (let i = 0; i < this.statements.length; i++) {
      let statement = this.statements[i];
      if (statement.uuid === uuid) return statement;
    }
    for (let i = 0; i < this.models.length; i++) {
      let statement = this.models[i].findStatementByUuid(uuid);
      if (statement) return statement;
    }
    return null;
  }
  updateStatements() {
    this.statements.forEach(statement => {
      statement.update();
    });
  }
  updateLinks() {
    // clear links
    this.statements.forEach(statement => {
      statement.parents = [];
      statement.children = [];
    });
    // iterate and add links
    this.statements.forEach(statement => {
      statement.childIds.forEach(id => {
        let matches = id.match(reNegativeId);
        if (matches) id = matches[1];
        let child = this.findStatementById(id);
        if (child instanceof Statement) {
          statement.children.push(child);
          child.parents.push(statement);
        } else {
          // ユーザーにエラー通知
          atom.notifications.addError("Missing statement: " + id);
        }
      });
    });
  }
  rootStatements() {
    let roots = [];
    this.statements.forEach(statement => {
      if (statement.isRoot()) roots.push(statement);
    });
    return roots;
  }
  updateValues() {
    // clear all values
    this.statements.forEach(statement => {
      statement.clearValue();
    });

    // evaluate all values
    this.statements.forEach(statement => {
      statement.evaluate();
    });
  }
  addStatement(statement) {
    this.statements.push(statement);
  }
  importFile(importPath) {
    let dirpath = path.dirname(this.filepath);
    let filepath = path.join(dirpath, importPath);

    if (fs.existsSync(filepath)) {
      let model = new Model(filepath);
      this.models.push(model);
    } else {
      // ユーザーにエラー通知
      atom.notifications.addError("Import not found: " + importPath);
    }
  }
}

const reNegativeId = /^-([\d]+)$/;
