/**
 * Keyboard bindings to control controller.
 * Position controller in front of camera.
 */
AFRAME.registerComponent('debug-controller', {
  init: function () {
    var primaryHand;
    var secondaryHand;

    if (!AFRAME.utils.getUrlParameter('debug')) { return; }

    console.log('%c debug-controller enabled ', 'background: #111; color: red');

    this.isCloning = false;
    this.isDeleting = false;
    this.isTriggerDown = false;

    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    primaryHand = document.getElementById('rightHand');
    secondaryHand = document.getElementById('leftHand');

    window.addEventListener('click', evt => {
      if (!evt.isTrusted) { return; }
      primaryHand.emit('triggerdown');
      primaryHand.emit('triggerup');
    });

    if (AFRAME.utils.getUrlParameter('debug') === 'oculus') {
      primaryHand.emit('controllerconnected', {name: 'oculus-touch-controls'});
      secondaryHand.emit('controllerconnected', {name: 'oculus-touch-controls'});
      primaryHand.setAttribute('controller', 'controllerType', 'oculus-touch-controls');
      secondaryHand.setAttribute('controller', 'controllerType', 'oculus-touch-controls');
    } else {
      primaryHand.emit('controllerconnected', {name: 'vive-controls'});
      secondaryHand.emit('controllerconnected', {name: 'vive-controls'});
      primaryHand.setAttribute('controller', 'controllerType', 'vive-controls');
      secondaryHand.setAttribute('controller', 'controllerType', 'vive-controls');
    }

    // Enable raycaster.
    this.el.emit('enter-vr', null, false);

    document.addEventListener('keydown', evt => {
      var primaryPosition;
      var primaryRotation;
      var secondaryPosition;
      var secondaryRotation;

      if (!evt.shiftKey) { return; }

      // <space> for trigger.
      if (evt.keyCode === 32) {
        if (this.isTriggerDown) {
          primaryHand.emit('triggerup');
          this.isTriggerDown = false;
        } else {
          primaryHand.emit('triggerdown');
          this.isTriggerDown = true;
        }
        return;
      }

      // <q> for secondary trigger.
      if (evt.keyCode === 81) {
        if (this.isSecondaryTriggerDown) {
          secondaryHand.emit('triggerup');
          this.isSecondaryTriggerDown = false;
        } else {
          secondaryHand.emit('triggerdown');
          this.isSecondaryTriggerDown = true;
        }
        return;
      }

      // <n> secondary grip.
      if (evt.keyCode === 78) {
        if (this.secondaryGripDown) {
          secondaryHand.emit('gripup');
          this.secondaryGripDown = false;
        } else {
          secondaryHand.emit('gripdown');
          this.secondaryGripDown = true;
        }
      }

      // <m> primary grip.
      if (evt.keyCode === 77) {
        if (this.primaryGripDown) {
          primaryHand.emit('gripup');
          this.primaryGripDown = false;
        } else {
          primaryHand.emit('gripdown');
          this.primaryGripDown = true;
        }
      }

      // Menu button <1>.
      if (evt.keyCode === 49) {
        secondaryHand.emit('menudown');
      }

      // Position bindings.
      if (evt.ctrlKey) {
        secondaryPosition = secondaryHand.getAttribute('position');
        if (evt.keyCode === 72) { secondaryPosition.x -= 0.01; }  // h.
        if (evt.keyCode === 74) { secondaryPosition.y -= 0.01; }  // j.
        if (evt.keyCode === 75) { secondaryPosition.y += 0.01; }  // k.
        if (evt.keyCode === 76) { secondaryPosition.x += 0.01; }  // l.
        if (evt.keyCode === 59 || evt.keyCode === 186) { secondaryPosition.z -= 0.01; }  // ;.
        if (evt.keyCode === 222) { secondaryPosition.z += 0.01; }  // ;.
        secondaryHand.setAttribute('position', AFRAME.utils.clone(secondaryPosition));
      } else {
        primaryPosition = primaryHand.getAttribute('position');
        if (evt.keyCode === 72) { primaryPosition.x -= 0.01; }  // h.
        if (evt.keyCode === 74) { primaryPosition.y -= 0.01; }  // j.
        if (evt.keyCode === 75) { primaryPosition.y += 0.01; }  // k.
        if (evt.keyCode === 76) { primaryPosition.x += 0.01; }  // l.
        if (evt.keyCode === 59 || evt.keyCode === 186) { primaryPosition.z -= 0.01; }  // ;.
        if (evt.keyCode === 222) { primaryPosition.z += 0.01; }  // ;.
        primaryHand.setAttribute('position', AFRAME.utils.clone(primaryPosition));
      }

      // Rotation bindings.
      if (evt.ctrlKey) {
        secondaryRotation = secondaryHand.getAttribute('rotation');
        if (evt.keyCode === 89) { secondaryRotation.x -= 10; }  // y.
        if (evt.keyCode === 79) { secondaryRotation.x += 10; }  // o.
        if (evt.keyCode === 85) { secondaryRotation.y -= 10; }  // u.
        if (evt.keyCode === 73) { secondaryRotation.y += 10; }  // i.
        secondaryHand.setAttribute('rotation', AFRAME.utils.clone(secondaryRotation));
      } else {
        primaryRotation = primaryHand.getAttribute('rotation');
        if (evt.keyCode === 89) { primaryRotation.x -= 10; }  // y.
        if (evt.keyCode === 79) { primaryRotation.x += 10; }  // o.
        if (evt.keyCode === 85) { primaryRotation.y -= 10; }  // u.
        if (evt.keyCode === 73) { primaryRotation.y += 10; }  // i.
        primaryHand.setAttribute('rotation', AFRAME.utils.clone(primaryRotation));
      }
    });
  },

  play: function () {
    var primaryHand;
    var secondaryHand;

    this.bounds = document.body.getBoundingClientRect();

    if (!AFRAME.utils.getUrlParameter('debug')) { return; }

    primaryHand = document.getElementById('rightHand');
    secondaryHand = document.getElementById('leftHand');

    secondaryHand.object3D.position.set(-0.2, 1.5, -0.5);
    primaryHand.object3D.position.set(0.2, 1.5, -0.5);
    secondaryHand.setAttribute('rotation', {x: 35, y: 0, z: 0});
  },

  onMouseMove: (function () {
    const direction = new THREE.Vector3();
    const mouse = new THREE.Vector2();
    const cameraPos = new THREE.Vector3();

    return function (evt) {
      const bounds = this.bounds;
      const camera = this.el.sceneEl.camera;
      const left = evt.clientX - bounds.left;
      const top = evt.clientY - bounds.top;
      mouse.x = (left / bounds.width) * 2 - 1;
      mouse.y = (-top / bounds.height) * 2 - 1;

      document.getElementById('camera').object3D.getWorldPosition(cameraPos);
      direction.set(mouse.x, mouse.y, 0.5).unproject(camera).sub(cameraPos).normalize();

      const handPos = document.getElementById('rightHand').object3D.position;
      const distance = -cameraPos.z / direction.z;
      camera.getWorldPosition(handPos).add(direction.multiplyScalar(distance));
      handPos.y += 0.8;
    };
  })()
});
