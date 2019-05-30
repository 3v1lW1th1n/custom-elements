/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

suite('polyfillLazyDefine', function() {
  var work;
  var assert = chai.assert;
  var HTMLNS = 'http://www.w3.org/1999/xhtml';

  customElements.enableFlush = true;

  setup(function() {
    work = document.createElement('div');
    document.body.appendChild(work);
  });

  teardown(function() {
    document.body.removeChild(work);
  });

  suite('defining', function() {

    test('requires a name argument', function() {
      assert.throws(function() {
        customElements.polyfillDefineLazy();
      }, '', 'customElements.define failed to throw when given no arguments');
    });

    test('name must contain a dash', function() {
      assert.throws(function () {
        customElements.polyfillDefineLazy('xfoo', () => {prototype: Object.create(HTMLElement.prototype)});
      }, '', 'customElements.define failed to throw when given no arguments');
    });

    test('name must not be a reserved name', function() {
      assert.throws(function() {
        customElements.polyfillDefineLazy('font-face', () => {prototype: Object.create(HTMLElement.prototype)});
      }, '', 'Failed to execute \'defineElement\' on \'Document\': Registration failed for type \'font-face\'. The type name is invalid.');
    });

    test('name must be unique', function() {
      const generator = () => class XDuplicate extends HTMLElement {};
      customElements.polyfillDefineLazy('x-lazy-duplicate', generator);
      assert.throws(function() {
        customElements.polyfillDefineLazy('x-lazy-duplicate', generator);
      }, '', 'customElements.define failed to throw when called multiple times with the same element name');
    });

    test('name must be unique and not defined', function() {
      customElements.define('x-lazy-duplicate-define', class extends HTMLElement {});
      assert.throws(function() {
        customElements.polyfillDefineLazy('x-lazy-duplicate-define', () => class extends HTMLElement {});
      }, '', 'customElements.define failed to throw when called multiple times with the same element name');
    });

    test('names are case-sensitive', function() {
      const generator = () => class XCase extends HTMLElement {};
      assert.throws(function() { customElements.polyfillDefineLazy('X-CASE', generator); });
    });

    test('requires a constructor argument', function() {
      assert.throws(function () {
        customElements.polyfillDefineLazy('x-no-options');
      }, '', 'customElements.define failed to throw without a constructor argument');
    });

  });

  suite('get', function() {

    test('returns undefined and constructor after element upgrades', function() {
      customElements.polyfillDefineLazy('x-get-lazy', () => class extends HTMLElement {});
      assert.isUndefined(customElements.get('x-get-lazy'));
      document.createElement('x-get-lazy');
      assert.ok(customElements.get('x-get-lazy'));
    });

  });

  suite('whenDefined', function() {

    test('resolves when a lazy define is first upgraded', function() {
      customElements.polyfillDefineLazy('x-when-defined-lazy', () =>class extends HTMLElement {});
      const el = document.createElement('x-when-defined-lazy');
      work.appendChild(el);
      return customElements.whenDefined('x-when-defined-lazy');
    });

    test('resolves when a lazy define promise is first upgraded', function() {
      customElements.polyfillDefineLazy('x-when-defined-lazy-promise', () =>
        new Promise((resolve) => resolve(class extends HTMLElement {})));
      const el = document.createElement('x-when-defined-lazy-promise');
      work.appendChild(el);
      return customElements.whenDefined('x-when-defined-lazy-promise');
    });

  });

  suite('upgrades', function() {

    test('createElement upgrades when defined (without promise)', function() {
      customElements.polyfillDefineLazy('lazy-create-upgrade', () => {
        return class extends HTMLElement {
          constructor() {
            super();
            this.upgraded = true;
          }
        }
      });
      const el = document.createElement('lazy-create-upgrade');
      assert.isTrue(el.upgraded);
    });

    test('createElement/connect upgrades when defined (with promise)', function(done) {
      customElements.polyfillDefineLazy('lazy-promise-create-upgrade', () =>
        new Promise((resolve) => resolve(class extends HTMLElement {
          constructor() {
            super();
            this.upgraded = true;
          }
          connectedCallback() {
            this.connected = true;
          }
        })));
      const el = document.createElement('lazy-promise-create-upgrade');
      work.appendChild(el);
      customElements.whenDefined('lazy-promise-create-upgrade').then(() => {
        assert.isTrue(el.upgraded);
        assert.isTrue(el.connected);
        done();
      });

    });

    test('element in dom upgrades (without promise)', function() {
      const el = document.createElement('lazy-dom-upgrade');
      work.appendChild(el);
      customElements.polyfillDefineLazy('lazy-dom-upgrade', () => {
        return class extends HTMLElement {
          constructor() {
            super();
            this.upgraded = true;
          }
          connectedCallback() {
            this.connected = true;
          }
        }
      });
      assert.isTrue(el.upgraded);
      assert.isTrue(el.connected);
    });

    test('element in dom upgrades (with promise)', function(done) {
      const el = document.createElement('lazy-promise-dom-upgrade');
      work.appendChild(el);
      customElements.polyfillDefineLazy('lazy-promise-dom-upgrade', () =>
        new Promise((resolve) => resolve(class extends HTMLElement {
          constructor() {
            super();
            this.upgraded = true;
          }
          connectedCallback() {
            this.connected = true;
          }
        })));
      customElements.whenDefined('lazy-promise-dom-upgrade').then(() => {
        assert.isTrue(el.upgraded);
        assert.isTrue(el.connected);
        done();
      });
    });

   });

});
