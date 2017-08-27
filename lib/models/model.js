'use babel';
import Statement from './statement';

export default class Model {
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
      let expr = statement.expr;
      if (expr === undefined) return;
      if (expr === true) return;
      if (expr === false) return;
      let idsText = "";
      if (expr.startsWith('=(')) {
        idsText = expr.substring(2, expr.length - 1);
        expr = '=';
      } else if (expr.startsWith('not(')) {
        idsText = expr.substring(4, expr.length - 1);
        expr = 'not';
      } else if (expr.startsWith('and(')) {
        idsText = expr.substring(4, expr.length - 1);
        expr = 'and';
      } else if (expr.startsWith('or(')) {
        idsText = expr.substring(3, expr.length - 1);
        expr = 'or';
      }
      statement.expr = expr;
      idsText.replace(/\s/g, '').split(',').forEach(id => {
        if ("" === id) return;
        let child = this.findStatementById(id);
        if (child instanceof Statement) {
          statement.children.push(child);
          child.parents.push(statement);
        } else {
          console.log("Not found statement with id = " + id);
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
