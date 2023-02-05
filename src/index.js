function requireAll (req) { req.keys().forEach(req); }

console.time = () => {
};
console.timeEnd = () => {
};

require('../vendor/BufferGeometryUtils');

require('aframe-aabb-collider-component');
require('aframe-atlas-uvs-component');
require('aframe-audioanalyser-component');
require('aframe-event-set-component');
require('aframe-geometry-merger-component');
require('aframe-haptics-component');
require('aframe-layout-component');
if (process.env.DEBUG_LOG) {
  require('aframe-log-component');
} else {
  AFRAME.log = () => void 0;
}
require('aframe-orbit-controls');
require('aframe-proxy-event-component');
require('aframe-render-order-component');
require('aframe-state-component');
require('aframe-slice9-component');
require('aframe-thumb-controls-component');

requireAll(require.context('./components/', true, /\.js$/));
requireAll(require.context('./state/', true, /\.js$/));

require('./index.css');

require('./scene.html');

if (module.hot) { module.hot.accept(); }

document.addEventListener('DOMContentLoaded', () => {
  initNoticeForm();
  initSubscribeForm();
});

/**
 * Init XHR handler to notice.
 */
function initNoticeForm () {
  if (localStorage.getItem('noticeClosed')) {
    let span = document.getElementById("brokenNotice");
    span.parentNode.removeChild(span);
    return;
  }

  document.getElementById('noticeClose').addEventListener('click', () => {
    console.log(this);
    let span = document.getElementById("brokenNotice");
    span.parentNode.removeChild(span);
    localStorage.setItem('noticeClosed', true);
  });
}

/**
 * Init XHR handler to subscribe.
 */
function initSubscribeForm () {
  const form = document.querySelector('form');
  if (!form) { return; }

  if (localStorage.getItem('subscribeClosed')) {
    const formParent = form.parentNode;
    formParent.parentNode.removeChild(formParent);
    return;
  }

  document.getElementById('subscribeClose').addEventListener('click', () => {
    const formParent = form.parentNode;
    formParent.parentNode.removeChild(formParent);
    localStorage.setItem('subscribeClosed', true);
  });

  const button = form.querySelector('.submit');
  const input = form.querySelector('input[type="email"]');
  const newsletterHeader = document.querySelector('#subscribeForm > h2');

  let originalHeaderText = '';
  if (newsletterHeader) {
    originalHeaderText = newsletterHeader.innerHTML;
  }

  form.addEventListener('submit', evt => {
    evt.preventDefault();

    // supermedium/superchimp
    const xhr = new XMLHttpRequest();
    let endpoint = 'http://localhost:5000/mail/subscribe';
    if (process.env.NODE_ENV === 'production') {
      endpoint = 'https://supermedium.com/mail/subscribe';
    }
    xhr.open('POST', endpoint);

    xhr.addEventListener('load', () => {
      if (parseInt(xhr.status, 10) !== 200) {
        window.location.href = 'https://supermedium/subscribe/';
      }
      if (button) {
        button.disabled = true;
        button.innerHTML = 'Subscribed!';
      }
      if (newsletterHeader) {
        newsletterHeader.innerHTML = 'Successfully subscribed, thank you!';
      }
    });

    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(JSON.stringify({
      email: document.querySelector('[name="email"]').value,
      source: 'moonrider'
    }));

    return false;
  });

  if (button) {
    input.addEventListener('keydown', () => {
      if (button.hasAttribute('disabled')) {
        button.innerHTML = 'Subscribe';
        button.removeAttribute('disabled');
      }
      if (newsletterHeader && originalHeaderText) {
        newsletterHeader.innerHTML = originalHeaderText;
      }
    });
  }
}

// Redirect to HTTPS in production.
if (window.location.protocol === 'http:' && !window.location.host.startsWith('localhost')) {
  window.location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
