
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toType = toType;
exports.noop = noop;
exports.isWindow = isWindow;
exports.isPlainObject = isPlainObject;
exports.isFunction = isFunction;
exports.makeArray = makeArray;
exports.merge = merge;
exports.each = each;
exports.extend = extend;
exports.isObject = isObject;
exports.isUndefined = isUndefined;
exports.isDefined = isDefined;
exports.isString = isString;
exports.lowercase = lowercase;
exports.NODE_TYPE_DOCUMENT_FRAGMENT = exports.NODE_TYPE_DOCUMENT = exports.NODE_TYPE_COMMENT = exports.NODE_TYPE_TEXT = exports.NODE_TYPE_ATTRIBUTE = exports.NODE_TYPE_ELEMENT = exports.getProto = exports.ObjectFunctionString = exports.fnToString = exports.hasOwn = exports.toString = exports.push = void 0;

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/is-array"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _getPrototypeOf = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-prototype-of"));

var push = Array.prototype.push;
exports.push = push;
var toString = Object.prototype.toString;
exports.toString = toString;
var hasOwn = Object.prototype.hasOwnProperty;
exports.hasOwn = hasOwn;
var fnToString = hasOwn.toString;
exports.fnToString = fnToString;
var ObjectFunctionString = fnToString.call(Object);
exports.ObjectFunctionString = ObjectFunctionString;
var getProto = _getPrototypeOf.default;
exports.getProto = getProto;
var class2type = {};
each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (i, name) {
  class2type["[object " + name + "]"] = name.toLowerCase();
});

function toType(obj) {
  if (obj == null) {
    return obj + "";
  }

  return (0, _typeof2.default)(obj) === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : (0, _typeof2.default)(obj);
}

function isArrayLike(obj) {
  var length = !!obj && "length" in obj && obj.length,
      type = toType(obj);

  if (isFunction(obj) || isWindow(obj)) {
    return false;
  }

  return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
}

function noop() {}

function isWindow(obj) {
  return obj != null && obj === obj.window;
}

function isPlainObject(obj) {
  var proto, Ctor;

  if (!obj || toString.call(obj) !== "[object Object]") {
    return false;
  }

  proto = getProto(obj);

  if (!proto) {
    return true;
  }

  Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
  return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
}

function isFunction(obj) {
  return typeof obj === "function" && typeof obj.nodeType !== "number";
}

function makeArray(arr, results) {
  var ret = results || [];

  if (arr != null) {
    if (isArrayLike(Object(arr))) {
      merge(ret, typeof arr === "string" ? [arr] : arr);
    } else {
      push.call(ret, arr);
    }
  }

  return ret;
}

function merge(first, second) {
  var len = +second.length,
      j = 0,
      i = first.length;

  for (; j < len; j++) {
    first[i++] = second[j];
  }

  first.length = i;
  return first;
}

function each(obj, callback) {
  var length,
      i = 0;

  if (isArrayLike(obj)) {
    length = obj.length;

    for (; i < length; i++) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  } else {
    for (i in obj) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  }

  return obj;
}

function extend() {
  var options,
      name,
      src,
      copy,
      copyIsArray,
      clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false; // Handle a deep copy situation

  if (typeof target === "boolean") {
    deep = target; // Skip the boolean and the target

    target = arguments[i] || {};
    i++;
  } // Handle case when target is a string or something (possible in deep copy)


  if ((0, _typeof2.default)(target) !== "object" && !isFunction(target)) {
    target = {};
  } // Extend jQuery itself if only one argument is passed


  if (i === length) {
    target = this;
    i--;
  }

  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    if ((options = arguments[i]) != null) {
      // Extend the base object
      for (name in options) {
        src = target[name];
        copy = options[name]; // Prevent never-ending loop

        if (target === copy) {
          continue;
        } // Recurse if we're merging plain objects or arrays


        if (deep && copy && (isPlainObject(copy) || (copyIsArray = (0, _isArray.default)(copy)))) {
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && (0, _isArray.default)(src) ? src : [];
          } else {
            clone = src && isPlainObject(src) ? src : {};
          } // Never move original objects, clone them


          target[name] = extend(deep, clone, copy); // Don't bring in undefined values
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  } // Return the modified object


  return target;
}

var NODE_TYPE_ELEMENT = 1;
exports.NODE_TYPE_ELEMENT = NODE_TYPE_ELEMENT;
var NODE_TYPE_ATTRIBUTE = 2;
exports.NODE_TYPE_ATTRIBUTE = NODE_TYPE_ATTRIBUTE;
var NODE_TYPE_TEXT = 3;
exports.NODE_TYPE_TEXT = NODE_TYPE_TEXT;
var NODE_TYPE_COMMENT = 8;
exports.NODE_TYPE_COMMENT = NODE_TYPE_COMMENT;
var NODE_TYPE_DOCUMENT = 9;
exports.NODE_TYPE_DOCUMENT = NODE_TYPE_DOCUMENT;
var NODE_TYPE_DOCUMENT_FRAGMENT = 11;
exports.NODE_TYPE_DOCUMENT_FRAGMENT = NODE_TYPE_DOCUMENT_FRAGMENT;

function isObject(value) {
  return value !== null && (0, _typeof2.default)(value) === 'object';
}

function isUndefined(value) {
  return typeof value === 'undefined';
}

function isDefined(value) {
  return typeof value !== 'undefined';
}

function isString(value) {
  return typeof value === 'string';
}

function lowercase(string) {
  return isString(string) ? string.toLowerCase() : string;
}