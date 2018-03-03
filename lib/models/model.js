'use babel';
import SadParser from './sad-parser';
import Statement from './statement';

export default class Model {
  static createFromText(text) {
    let model = new Model();
    let parser = new SadParser(model);
    parser.parseText(text);
    model.updateLinks();
    model.updateValues();
    return model;
  }

  statements = [];
  findStatementById(id) {
    for (let i = 0; i < this.statements.length; i++) {
      let statement = this.statements[i];
      if (statement.id === id) return statement;
    }
    return null;
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
}

const reNegativeId = /^-([\d]+)$/;
