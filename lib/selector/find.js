"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _matches = _interopRequireDefault(require("bplokjs-dom-utils/matches"));

var _utils = require("./utils");

function find(selector, context, results, seed) {
  let elem,
      nodeType,
      i = 0;
  results = results || [];
  context = context || document; // Same basic safeguard as Sizzle

  if (!selector || typeof selector !== "string") {
    return results;
  } // Early return if context is not an element or document


  if ((nodeType = context.nodeType) !== _utils.NODE_TYPE_ELEMENT && nodeType !== _utils.NODE_TYPE_DOCUMENT) {
    return [];
  }

  if (seed) {
    while (elem = seed[i++]) {
      if ((0, _matches.default)(elem, selector)) {
        results.push(elem);
      }
    }
  } else {
    (0, _utils.merge)(results, context.querySelectorAll(selector));
  }

  return results;
}

var _default = find;
exports.default = _default;