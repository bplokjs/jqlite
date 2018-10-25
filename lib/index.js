"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = JQLite;

var _utils = require("./selector/utils");

var _domReady = _interopRequireDefault(require("bplokjs-dom-utils/domReady"));

var _parseHTML = _interopRequireDefault(require("./selector/parseHTML"));

var _find = _interopRequireDefault(require("./selector/find"));

var _offset = _interopRequireDefault(require("bplokjs-dom-utils/offset"));

var _position = _interopRequireDefault(require("./position"));

var _offsetParent = _interopRequireDefault(require("bplokjs-dom-utils/offsetParent"));

var _matches = _interopRequireDefault(require("bplokjs-dom-utils/matches"));

var _classes = require("bplokjs-dom-utils/classes");

var _closest = _interopRequireDefault(require("bplokjs-dom-utils/closest"));

var _css = _interopRequireDefault(require("bplokjs-dom-utils/css"));

const rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;
const BOOLEAN_ATTR = {};
(0, _utils.each)('multiple,selected,checked,disabled,readOnly,required,open'.split(','), function (i, value) {
  BOOLEAN_ATTR[(0, _utils.lowercase)(value)] = value;
}); //////////////////////////////////////////////

function JQLite(selector, context) {
  if (!(this instanceof JQLite)) {
    return new JQLite(selector, context);
  }

  if (selector instanceof JQLite) {
    return selector;
  } // HANDLE: $(""), $(null), $(undefined), $(false)


  if (!selector) {
    return this;
  }

  let match, elem;

  if (typeof selector === "string") {
    if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
      // Assume that strings that start and end with <> are HTML and skip the regex check
      match = [null, selector, null];
    } else {
      match = rquickExpr.exec(selector);
    } // Match html or make sure no context is specified for #id


    if (match && (match[1] || !context)) {
      // HANDLE: $(html) -> $(array)
      if (match[1]) {
        context = context instanceof JQLite ? context[0] : context; // Option to run scripts is true for back-compat
        // Intentionally let the error be thrown if parseHTML is not present

        (0, _utils.merge)(this, (0, _parseHTML.default)(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
        return this; // HANDLE: $(#id)
      } else {
        elem = document.getElementById(match[2]);

        if (elem) {
          // Inject the element directly into the jQuery object
          this[0] = elem;
          this.length = 1;
        }

        return this;
      } // HANDLE: $(expr, $(...))

    } else if (!context) {
      return (0, _find.default)(selector, document, new JQLite()); // HANDLE: $(expr, context)
      // (which is just equivalent to: $(context).find(expr)
    } else {
      return JQLite(context).find(selector);
    } // HANDLE: $(DOMElement)

  } else if (selector.nodeType) {
    this[0] = selector;
    this.length = 1;
    return this; // HANDLE: $(function)
    // Shortcut for document ready
  } else if ((0, _utils.isFunction)(selector)) {
    (0, _domReady.default)(selector);
  }

  return (0, _utils.makeArray)(selector, this);
}

const JQLitePrototype = JQLite.fn = JQLite.prototype = {
  ready: _domReady.default,
  toString: function () {
    const value = [];
    (0, _utils.each)(this, function (i, e) {
      value.push('' + e);
    });
    return '[' + value.join(', ') + ']';
  },
  eq: function (index) {
    return index >= 0 ? JQLite(this[index]) : JQLite(this[this.length + index]);
  },
  length: 0,
  push: _utils.push,
  sort: [].sort,
  splice: [].splice,
  extend: _utils.extend,
  find: function (selector) {
    let i,
        ret,
        len = this.length,
        self = this;
    ret = new JQLite();

    for (i = 0; i < len; i++) {
      (0, _find.default)(selector, self[i], ret);
    }

    return ret; //len > 1 ? jQuery.uniqueSort( ret ) : ret;	
  },
  each: function (callback) {
    return (0, _utils.each)(this, callback);
  }
};

if (typeof Symbol === "function") {
  let arr = [];
  JQLitePrototype[Symbol.iterator] = arr[Symbol.iterator];
}

function jqLiteWidthOrHeightCreator(type) {
  const funcName = (0, _utils.lowercase)(type);
  return function (elem, value) {
    if ((0, _utils.isWindow)(elem)) {
      return elem.document.documentElement["client" + type];
    }

    if (elem.nodeType === _utils.NODE_TYPE_DOCUMENT) {
      const doc = elem.documentElement; // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
      // whichever is greatest

      return Math.max(elem.body["scroll" + type], doc["scroll" + type], elem.body["offset" + type], doc["offset" + type], doc["client" + type]);
    }

    const exp1 = type === 'Width' ? 'Left' : 'Top';
    const exp2 = type === 'Width' ? 'Right' : 'Bottom'; //getter

    if (value === undefined) {
      return elem.offsetWidth - parseFloat((0, _css.default)(elem, `border${exp1}${type}`)) - parseFloat((0, _css.default)(elem, `padding${exp1}`)) - parseFloat((0, _css.default)(elem, `padding${exp2}`)) - parseFloat((0, _css.default)(elem, `border${exp2}${type}`)); //setter		
    } else {
      const isBorderBox = (0, _css.default)(elem, "boxSizing") === "border-box";
      const borderOrPadding = parseFloat((0, _css.default)(elem, `border${exp1}${type}`)) + parseFloat((0, _css.default)(elem, `padding${exp1}`)) + parseFloat((0, _css.default)(elem, `padding${exp2}`)) + parseFloat((0, _css.default)(elem, `border${exp2}${type}`));
      (0, _css.default)(elem, funcName, !isBorderBox || value === "" ? value : (value || 0) - borderOrPadding);
    }
  };
}

function jqLiteAttr(element, name, value) {
  let ret;
  const nodeType = element.nodeType;

  if (nodeType === _utils.NODE_TYPE_TEXT || nodeType === _utils.NODE_TYPE_ATTRIBUTE || nodeType === _utils.NODE_TYPE_COMMENT || !element.getAttribute) {
    return;
  }

  const lowercasedName = (0, _utils.lowercase)(name);
  const isBooleanAttr = BOOLEAN_ATTR[lowercasedName];

  if ((0, _utils.isDefined)(value)) {
    // setter
    if (value === null || value === false && isBooleanAttr) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, isBooleanAttr ? lowercasedName : value);
    }
  } else {
    // getter
    ret = element.getAttribute(name);

    if (isBooleanAttr && ret !== null) {
      ret = lowercasedName;
    } // Normalize non-existing attributes to undefined (as jQuery).


    return ret === null ? undefined : ret;
  }
}

function jqLiteProp(element, name, value) {
  if ((0, _utils.isDefined)(value)) {
    element[name] = value;
  } else {
    return element[name];
  }
} ////////////Methods////////////////


(0, _utils.each)({
  append: function (node) {
    node = new JQLite(node);
    return this.each(function (i, elem) {
      const nodeType = elem.nodeType;
      if (nodeType !== _utils.NODE_TYPE_ELEMENT && nodeType !== _utils.NODE_TYPE_DOCUMENT_FRAGMENT) return;

      for (let i = 0, ii = node.length; i < ii; i++) {
        const child = node[i];
        elem.appendChild(child);
      }
    });
  },
  prepend: function (node) {
    node = new JQLite(node);
    return this.each(function (i, elem) {
      if (elem.nodeType === _utils.NODE_TYPE_ELEMENT) {
        const index = elem.firstChild;
        (0, _utils.each)(node, function (i, child) {
          elem.insertBefore(child, index);
        });
      }
    });
  },
  remove: function () {
    return this.each(function (elem) {
      const parent = elem.parentNode;
      if (parent) parent.removeChild(elem);
    });
  },
  children: function () {
    const children = [];
    this.each(function (i, elem) {
      (0, _utils.each)(elem.childNodes, function (ii, element) {
        if (element.nodeType === _utils.NODE_TYPE_ELEMENT) {
          children.push(element);
        }
      });
    });
    return children;
  },
  width: function (value) {
    const length = this.length;
    if (!length) return value === undefined ? undefined : this;
    const func = jqLiteWidthOrHeightCreator('Width');

    if (value === undefined) {
      const elem = this[0];
      return func(elem);
    } else {
      for (let i = 0; i < length; i++) {
        func(this[i], value);
      }
    }

    return this;
  },
  height: function (value) {
    const length = this.length;
    if (!length) return value === undefined ? undefined : this;
    const func = jqLiteWidthOrHeightCreator('Height');

    if (value === undefined) {
      const elem = this[0];
      return func(elem);
    } else {
      for (let i = 0; i < length; i++) {
        func(this[i], value);
      }
    }

    return this;
  },
  outerWidth: function () {
    const length = this.length;
    if (!length) return;
    const elem = this[0];

    if ((0, _utils.isWindow)(elem)) {
      return elem.innerWidth;
    }

    if (elem.nodeType === _utils.NODE_TYPE_DOCUMENT) return this.width();
    return elem.offsetWidth;
  },
  outerHeight: function () {
    const length = this.length;
    if (!length) return;
    const elem = this[0];

    if ((0, _utils.isWindow)(elem)) {
      return elem.innerHeight;
    }

    if (elem.nodeType === _utils.NODE_TYPE_DOCUMENT) return this.height();
    return elem.offsetHeight;
  },
  offset: function (coordinates) {
    if (coordinates) {
      return this.each(function (i, elem) {
        (0, _offset.default)(elem, coordinates);
      });
    }

    if (!this.length) return;
    return (0, _offset.default)(this[0]);
  },
  position: function () {
    if (!this.length) return;
    return (0, _position.default)(this[0]);
  },
  css: function (key, value) {
    if (value !== undefined) {
      return this.each(function (i, elem) {
        (0, _css.default)(elem, key, value);
      });
    } else if ((0, _utils.isObject)(key)) {
      for (var k in key) {
        this.css(k, key[k]);
      }

      return this;
    } else if (this.length) {
      return (0, _css.default)(this[0], key);
    }
  },
  attr: function (key, value) {
    if (value !== undefined) {
      return this.each(function (i, elem) {
        jqLiteAttr(elem, key, value);
      });
    } else if ((0, _utils.isObject)(key)) {
      for (let k in key) {
        this.attr(k, key[k]);
      }

      return this;
    } else if (this.length) {
      return jqLiteAttr(this[0], key);
    }
  },
  removeAttr: function (name) {
    return this.each(function (i, elem) {
      elem.removeAttribute(name);
    });
  },
  prop: function (key, value) {
    if (value !== undefined) {
      return this.each(function (i, elem) {
        jqLiteProp(elem, key, value);
      });
    } else if (this.length) {
      return jqLiteProp(this[0], key, value);
    }
  },
  filter: function (selector) {
    let elems = new JQLite(),
        elem,
        i,
        len;

    if ((0, _utils.isFunction)(selector)) {
      for (i = 0, len = this.length; i < len; i++) {
        elem = this[i];

        if (selector.call(elem, i, elem)) {
          elems.push(elem);
        }
      }
    } else if ((0, _utils.isString)(selector)) {
      for (i = 0, len = this.length, elem; i < len; i++) {
        elem = this[i];

        if ((0, _matches.default)(elem, selector)) {
          elems.push(elem);
        }
      }
    }

    return elems;
  },
  closest: function (selector) {
    const nodes = [];
    this.each(function (i, elem) {
      const node = (0, _closest.default)(elem, selector);
      if (node) nodes.push(node);
    });
    return new JQLite(nodes);
  },
  offsetParent: function () {
    if (this.length) return (0, _offsetParent.default)(this[0]);
  },
  hasClass: function (className) {
    for (let i = 0, n = this.length; i < n; i++) {
      if ((0, _classes.hasClass)(this[i], className)) {
        return true;
      }
    }

    return false;
  },
  addClass: function (className) {
    if (!className) return this;
    return this.each(function (i, elem) {
      className.split(/\s+/).forEach(name => (0, _classes.addClass)(elem, name));
    });
  },
  removeClass: function (className) {
    if (!className) return this;
    return this.each(function (i, elem) {
      className.split(/\s+/).forEach(name => (0, _classes.removeClass)(elem, name));
    });
  },
  toggleClass: function (className) {
    if (!className) return this;
    return this.each(function (i, elem) {
      className.split(/\s+/).forEach(name => (0, _classes.toggleClass)(elem, name));
    });
  },
  html: function (value) {
    if ((0, _utils.isUndefined)(value)) {
      if (this.length) return this[0].innerHTML;
    } else {
      return this.each(function (i, elem) {
        elem.innerHTML = value;
      });
    }
  },
  empty: function () {
    return this.each(function (i, elem) {
      while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
      }
    });
  }
}, function (name, func) {
  /**
      * Properties: writes return selection, reads return first value
      */
  JQLitePrototype[name] = func;
});
(0, _utils.each)({
  scrollLeft: "pageXOffset",
  scrollTop: "pageYOffset"
}, function (method, prop) {
  const top = "pageYOffset" === prop;

  JQLitePrototype[method] = function (val) {
    //getter
    if (val === undefined) {
      let win;
      const elem = this[0];
      if (!elem) return;

      if ((0, _utils.isWindow)(elem)) {
        win = elem;
      } else if (elem.nodeType === _utils.NODE_TYPE_DOCUMENT) {
        win = elem.defaultView;
      }

      return win ? win[prop] : elem[method];
    } //setter


    return this.each(function (i, elem) {
      let win;

      if ((0, _utils.isWindow)(elem)) {
        win = elem;
      } else if (elem.nodeType === _utils.NODE_TYPE_DOCUMENT) {
        win = elem.defaultView;
      }

      if (win) {
        win.scrollTo(!top ? val : win.pageXOffset, top ? val : win.pageYOffset);
      } else {
        elem[method] = val;
      }
    });
  };
}); ////////////Functions////////////////

(0, _utils.each)({
  extend: _utils.extend,
  each: _utils.each,
  isWindow: _utils.isWindow,
  css: _css.default
}, function (name, func) {
  JQLite[name] = func;
});