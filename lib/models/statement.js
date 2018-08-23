'use babel';

export default class Statement {
  id;
  text;
  expr = undefined;
  childIds = [];
  memos = [];
  parents = [];
  children = [];
  uuid;
  update() {
    let uuid = this.findMemo('uuid');
    if (uuid) this.uuid = uuid.strs[0].toLowerCase();
  }
  isRoot() {
    if (this.parents.length === 0) return true;
    return false;
  }
  isLeaf() {
    if (this.children.length === 0) return true;
    return false;
  }
  value;
  clearValue() {
    delete this.value;
  }
  evaluate() {
    if ('value' in this) return this.value;

    if (this.expr === true || this.expr === false || this.expr === undefined) {
      this.value = this.expr;
    } else if (this.expr === '=') {
      let childValue = this.children[0].evaluate();
      this.value = childValue;
    } else if (this.expr === 'not') {
      let childValue = this.children[0].evaluate();
      if (childValue === undefined) {
        this.value = undefined;
      } else {
        this.value = !childValue;
      }
    } else if (this.expr === 'and') {
      let value = true;
      for (let i = 0; i < this.children.length; i++) {
        let childValue = this.children[i].evaluate();
        if (childValue === false) {
          value = false;
          break;
        } else if (childValue === undefined) {
          value = undefined;
        }
      }
      this.value = value;
    } else if (this.expr === 'or') {
      let value = false;
      for (let i = 0; i < this.children.length; i++) {
        let childValue = this.children[i].evaluate();
        if (childValue === true) {
          value = true;
          break;
        } else if (childValue === undefined) {
          value = undefined;
        }
      }
      this.value = value;
    } else {
      // ここに処理が来ているということはバグである。
      atom.notifications.addFatalError('Unimplemented expr: "' + this.expr + '"');
      this.value = undefined;
    }

    return this.value;
  }
  findMemo(tag) {
    for (let idx = 0; idx < this.memos.length; idx++) {
      let memo = this.memos[idx];
      if (memo.tag === tag) return memo;
    }
    return undefined;
  }
}
