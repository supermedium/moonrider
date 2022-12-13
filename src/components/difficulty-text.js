// Unique difficulty naming.
AFRAME.registerComponent('difficulty-text', {
  schema: {
    id: { value: 'Standard-Easy' }
  },

  update: function () {
    this.el.setAttribute(
      'text', 'value',
      this.data.id
        .replace('Standard-', '')
        .replace('-', '\n')
    );
  }
});
