AFRAME.registerComponent('console-shortcuts', {
  play: function () {
    window.$ = val => document.querySelector(val);
    window.$$ = val => document.querySelectorAll(val);
    window.$$$ = val => document.querySelector(`[${val}]`).getAttribute(val);
    window.$$$$ = val => document.querySelector(`[${val}]`).components[val];
    window.scene = this.el;
    window.state = this.el.systems.state.state;
  }
});
