/**
 * Controller registration, cursor.
 */
AFRAME.registerComponent('controller', {
  schema: {
    hand: {default: 'right', oneOf: ['left', 'right']}
  },

  init: function () {
    const el = this.el;
    const data = this.data;

    this.controllerType = '';

    el.addEventListener('controllerconnected', evt => {
      this.controllerType = evt.detail.name;
      this.el.setAttribute('cursor', this.config[this.controllerType].cursor || {});
    });

    const hand = {hand: data.hand, model: false};
    el.setAttribute('daydream-controls', hand);
    el.setAttribute('oculus-go-controls', hand);
    el.setAttribute('oculus-touch-controls', {
      hand: data.hand,
      model: false,
      orientationOffset: {x: 0, y: 0, z: 0}
    });
    el.setAttribute('vive-controls', hand);
    el.setAttribute('vive-focus-controls', hand);
    el.setAttribute('windows-motion-controls', hand);
    el.setAttribute('generic-tracked-controller-controls', hand);
  },

  config: {
    'daydream-controls': {
      cursor: {
        downEvents: ['trackpaddown', 'triggerdown'],
        upEvents: ['trackpadup', 'triggerup']
      }
    },

    'oculus-go-controls': {
      cursor: {
        downEvents: ['trackpaddown', 'triggerdown'],
        upEvents: ['trackpadup', 'triggerup']
      }
    },

    'oculus-touch-controls': {
      cursor: {
        downEvents: [
          'triggerdown',
          'gripdown',
          'abuttondown',
          'bbuttondown',
          'xbuttondown',
          'ybuttondown'
        ],
        upEvents: [
          'triggerup',
          'gripup',
          'abuttonup',
          'bbuttonup',
          'xbuttonup',
          'ybuttonup'
        ]
      }
    },

    'vive-controls': {
      cursor: {
        downEvents: ['trackpaddown', 'triggerdown', 'gripdown'],
        upEvents: ['trackpadup', 'triggerup', 'gripup']
      }
    },

    'vive-focus-controls': {
      cursor: {
        downEvents: ['trackpaddown', 'triggerdown', 'gripdown'],
        upEvents: ['trackpadup', 'triggerup', 'gripup']
      }
    },

    'windows-motion-controls': {
      cursor: {
        downEvents: ['trackpaddown', 'triggerdown', 'gripdown'],
        upEvents: ['trackpadup', 'triggerup', 'gripup']
      }
    },

    'generic-tracked-controller-controls': {
      cursor: {
        downEvents: ['triggerdown'],
        upEvents: ['triggerup']
      }
    }
  }
});
