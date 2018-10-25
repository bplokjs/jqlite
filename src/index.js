import {
    push,
    each,
    merge,
    lowercase,
    isDefined,
    isFunction,
    isString,
    makeArray,
    isWindow,
    isUndefined,
    isObject,
    NODE_TYPE_DOCUMENT,
    NODE_TYPE_ATTRIBUTE,
    NODE_TYPE_TEXT,
    NODE_TYPE_COMMENT,
    NODE_TYPE_DOCUMENT_FRAGMENT,
    NODE_TYPE_ELEMENT,
    extend,
} from './selector/utils';

import domReady from 'bplokjs-dom-utils/domReady';

import parseHTML from './selector/parseHTML';
import find from './selector/find';

import offset from 'bplokjs-dom-utils/offset';
import position from './position';
import offsetParent from 'bplokjs-dom-utils/offsetParent';
import matches from 'bplokjs-dom-utils/matches';
import {
    hasClass,
    addClass,
    removeClass,
    toggleClass
} from 'bplokjs-dom-utils/classes';

import closest from 'bplokjs-dom-utils/closest';

import css from 'bplokjs-dom-utils/css';

const rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;
const BOOLEAN_ATTR = {};
each('multiple,selected,checked,disabled,readOnly,required,open'.split(','), function (i, value) {
    BOOLEAN_ATTR[lowercase(value)] = value;
});

//////////////////////////////////////////////
export default function JQLite(selector, context) {
    if (!(this instanceof JQLite)) {
        return new JQLite(selector, context);
    }

    if (selector instanceof JQLite) {
        return selector;
    }

    // HANDLE: $(""), $(null), $(undefined), $(false)
    if (!selector) {
        return this;
    }

    let match, elem;

    if (typeof selector === "string") {
        if (selector[0] === "<" &&
            selector[selector.length - 1] === ">" &&
            selector.length >= 3) {

            // Assume that strings that start and end with <> are HTML and skip the regex check
            match = [null, selector, null];

        } else {
            match = rquickExpr.exec(selector);
        }

        // Match html or make sure no context is specified for #id
        if (match && (match[1] || !context)) {

            // HANDLE: $(html) -> $(array)
            if (match[1]) {
                context = context instanceof JQLite ? context[0] : context;

                // Option to run scripts is true for back-compat
                // Intentionally let the error be thrown if parseHTML is not present
                merge(this, parseHTML(
                    match[1],
                    context && context.nodeType ? context.ownerDocument || context : document,
                    true
                ));

                return this;

                // HANDLE: $(#id)
            } else {
                elem = document.getElementById(match[2]);

                if (elem) {

                    // Inject the element directly into the jQuery object
                    this[0] = elem;
                    this.length = 1;
                }
                return this;
            }

            // HANDLE: $(expr, $(...))
        } else if (!context) {
            return find(selector, document, new JQLite());

            // HANDLE: $(expr, context)
            // (which is just equivalent to: $(context).find(expr)
        } else {
            return JQLite(context).find(selector);
        }

        // HANDLE: $(DOMElement)
    } else if (selector.nodeType) {
        this[0] = selector;
        this.length = 1;
        return this;

        // HANDLE: $(function)
        // Shortcut for document ready
    } else if (isFunction(selector)) {
        domReady(selector);
    }

    return makeArray(selector, this);
}

const JQLitePrototype = JQLite.fn = JQLite.prototype = {
    ready: domReady,
    toString: function () {
        const value = [];
        each(this, function (i, e) { value.push('' + e); });
        return '[' + value.join(', ') + ']';
    },

    eq: function (index) {
        return (index >= 0) ? JQLite(this[index]) : JQLite(this[this.length + index]);
    },

    length: 0,
    push: push,
    sort: [].sort,
    splice: [].splice,

    extend,

    find: function (selector) {
        let i, ret,
            len = this.length,
            self = this;

        ret = new JQLite();

        for (i = 0; i < len; i++) {
            find(selector, self[i], ret);
        }

        return ret;//len > 1 ? jQuery.uniqueSort( ret ) : ret;	
    },

    each: function (callback) {
        return each(this, callback);
    }
};

if (typeof Symbol === "function") {
    let arr = [];
    JQLitePrototype[Symbol.iterator] = arr[Symbol.iterator];
}

function jqLiteWidthOrHeightCreator(type) {
    const funcName = lowercase(type);

    return function (elem, value) {
        if (isWindow(elem)) {
            return elem.document.documentElement["client" + type];
        }

        if (elem.nodeType === NODE_TYPE_DOCUMENT) {
            const doc = elem.documentElement;

            // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
            // whichever is greatest
            return Math.max(
                elem.body["scroll" + type], doc["scroll" + type],
                elem.body["offset" + type], doc["offset" + type],
                doc["client" + type]
            );
        }

        const exp1 = type === 'Width' ? 'Left' : 'Top';
        const exp2 = type === 'Width' ? 'Right' : 'Bottom';

        //getter
        if (value === undefined) {
            return elem.offsetWidth -
                parseFloat(css(elem, `border${exp1}${type}`)) -
                parseFloat(css(elem, `padding${exp1}`)) -
                parseFloat(css(elem, `padding${exp2}`)) -
                parseFloat(css(elem, `border${exp2}${type}`));
            //setter		
        } else {
            const isBorderBox = css(elem, "boxSizing") === "border-box";

            const borderOrPadding = (
                parseFloat(css(elem, `border${exp1}${type}`)) +
                parseFloat(css(elem, `padding${exp1}`)) +
                parseFloat(css(elem, `padding${exp2}`)) +
                parseFloat(css(elem, `border${exp2}${type}`))
            );

            css(elem, funcName, !isBorderBox || value === "" ? value : (value || 0) - borderOrPadding);
        }
    };
}

function jqLiteAttr(element, name, value) {
    let ret;
    const nodeType = element.nodeType;
    if (nodeType === NODE_TYPE_TEXT || nodeType === NODE_TYPE_ATTRIBUTE || nodeType === NODE_TYPE_COMMENT ||
        !element.getAttribute) {
        return;
    }

    const lowercasedName = lowercase(name);
    const isBooleanAttr = BOOLEAN_ATTR[lowercasedName];

    if (isDefined(value)) {
        // setter

        if (value === null || (value === false && isBooleanAttr)) {
            element.removeAttribute(name);
        } else {
            element.setAttribute(name, isBooleanAttr ? lowercasedName : value);
        }
    } else {
        // getter

        ret = element.getAttribute(name);

        if (isBooleanAttr && ret !== null) {
            ret = lowercasedName;
        }
        // Normalize non-existing attributes to undefined (as jQuery).
        return ret === null ? undefined : ret;
    }
}

function jqLiteProp(element, name, value) {
    if (isDefined(value)) {
        element[name] = value;
    } else {
        return element[name];
    }
}

////////////Methods////////////////
each({

    append: function (node) {
        node = new JQLite(node);
        return this.each(function (i, elem) {
            const nodeType = elem.nodeType;
            if (nodeType !== NODE_TYPE_ELEMENT && nodeType !== NODE_TYPE_DOCUMENT_FRAGMENT) return;

            for (let i = 0, ii = node.length; i < ii; i++) {
                const child = node[i];
                elem.appendChild(child);
            }
        });
    },

    prepend: function (node) {
        node = new JQLite(node);
        return this.each(function (i, elem) {
            if (elem.nodeType === NODE_TYPE_ELEMENT) {
                const index = elem.firstChild;
                each(node, function (i, child) {
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
            each(elem.childNodes, function (ii, element) {
                if (element.nodeType === NODE_TYPE_ELEMENT) {
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

        if (isWindow(elem)) {
            return elem.innerWidth;
        }

        if (elem.nodeType === NODE_TYPE_DOCUMENT) return this.width();

        return elem.offsetWidth;
    },

    outerHeight: function () {
        const length = this.length;

        if (!length) return;

        const elem = this[0];

        if (isWindow(elem)) {
            return elem.innerHeight;
        }

        if (elem.nodeType === NODE_TYPE_DOCUMENT) return this.height();

        return elem.offsetHeight;
    },

    offset: function (coordinates) {
        if (coordinates) {
            return this.each(function (i, elem) {
                offset(elem, coordinates)
            });
        }

        if (!this.length) return;

        return offset(this[0]);
    },

    position: function () {
        if (!this.length) return;

        return position(this[0]);
    },

    css: function (key, value) {
        if (value !== undefined) {
            return this.each(function (i, elem) {
                css(elem, key, value);
            })
        } else if (isObject(key)) {
            for (var k in key) {
                this.css(k, key[k]);
            }
            return this;
        } else if (this.length) {
            return css(this[0], key);
        }
    },

    attr: function (key, value) {
        if (value !== undefined) {
            return this.each(function (i, elem) {
                jqLiteAttr(elem, key, value);
            })
        } else if (isObject(key)) {
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
        })
    },

    prop: function (key, value) {
        if (value !== undefined) {
            return this.each(function (i, elem) {
                jqLiteProp(elem, key, value);
            })
        } else if (this.length) {
            return jqLiteProp(this[0], key, value);
        }
    },

    filter: function (selector) {
        let elems = new JQLite(), elem, i, len;

        if (isFunction(selector)) {
            for (i = 0, len = this.length; i < len; i++) {
                elem = this[i];
                if (selector.call(elem, i, elem)) {
                    elems.push(elem);
                }
            }
        } else if (isString(selector)) {
            for (i = 0, len = this.length, elem; i < len; i++) {
                elem = this[i];
                if (matches(elem, selector)) {
                    elems.push(elem);
                }
            }
        }

        return elems;
    },

    closest: function (selector) {
        const nodes = [];

        this.each(function (i, elem) {
            const node = closest(elem, selector);
            if (node) nodes.push(node);
        });

        return new JQLite(nodes);
    },

    offsetParent: function () {
        if (this.length) return offsetParent(this[0]);
    },

    hasClass: function (className) {
        for (let i = 0, n = this.length; i < n; i++) {
            if (hasClass(this[i], className)) {
                return true;
            }
        }
        return false;
    },

    addClass: function (className) {
        if (!className) return this;
        return this.each(function (i, elem) {
            className.split(/\s+/).forEach(name => addClass(elem, name));
        });
    },

    removeClass: function (className) {
        if (!className) return this;
        return this.each(function (i, elem) {
            className.split(/\s+/).forEach(name => removeClass(elem, name));
        });
    },

    toggleClass: function (className) {
        if (!className) return this;
        return this.each(function (i, elem) {
            className.split(/\s+/).forEach(name => toggleClass(elem, name));
        });
    },

    html: function (value) {
        if (isUndefined(value)) {
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

each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (method, prop) {
    const top = "pageYOffset" === prop;

    JQLitePrototype[method] = function (val) {
        //getter
        if (val === undefined) {
            let win;
            const elem = this[0];

            if (!elem) return;

            if (isWindow(elem)) {
                win = elem;
            } else if (elem.nodeType === NODE_TYPE_DOCUMENT) {
                win = elem.defaultView;
            }

            return win ? win[prop] : elem[method];
        }

        //setter
        return this.each(function (i, elem) {
            let win;
            if (isWindow(elem)) {
                win = elem;
            } else if (elem.nodeType === NODE_TYPE_DOCUMENT) {
                win = elem.defaultView;
            }

            if (win) {
                win.scrollTo(
                    !top ? val : win.pageXOffset,
                    top ? val : win.pageYOffset
                );

            } else {
                elem[method] = val;
            }

        });
    };
});

////////////Functions////////////////
each({
    extend,
    each,
    isWindow,
    css,
}, function (name, func) {
    JQLite[name] = func;
});