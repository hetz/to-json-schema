'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var merge = require('lodash.merge');

var isEqual = require('lodash.isequal');

var helpers = require('./helpers');

var defaultOptions = {
  required: false,
  postProcessFnc: null,
  strings: {
    detectFormat: true,
    preProcessFnc: null
  },
  arrays: {
    mode: 'all',
    preProcessFnc: null
  },
  objects: {
    preProcessFnc: null,
    postProcessFnc: null,
    additionalProperties: true
  }
};
var skipReverseFind = ['hostname', 'host-name', 'alpha', 'alphanumeric', 'regex', 'regexp', 'pattern'];
var filteredFormats = helpers.stringFormats.filter(function (item) {
  return skipReverseFind.indexOf(item) < 0;
});

function getCommonTypeFromArrayOfTypes(arrOfTypes) {
  var lastVal;

  for (var i = 0, length = arrOfTypes.length; i < length; i++) {
    var currentType = arrOfTypes[i];

    if (i > 0) {
      if (currentType === 'integer' && lastVal === 'number') {
        currentType = 'number';
      } else if (currentType === 'number' && lastVal === 'integer') {
        lastVal = 'number';
      }

      if (lastVal !== currentType) return null;
    }

    lastVal = currentType;
  }

  return lastVal;
}

function getCommonArrayItemsType(arr) {
  return getCommonTypeFromArrayOfTypes(arr.map(function (item) {
    return helpers.getType(item);
  }));
}

var ToJsonSchema =
/*#__PURE__*/
function () {
  function ToJsonSchema(options) {
    _classCallCheck(this, ToJsonSchema);

    this.options = merge({}, defaultOptions, options);
    this.getObjectSchemaDefault = this.getObjectSchemaDefault.bind(this);
    this.getStringSchemaDefault = this.getStringSchemaDefault.bind(this);
    this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
    this.commmonPostProcessDefault = this.commmonPostProcessDefault.bind(this);
    this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
  }
  /**
   * Tries to find the least common schema that would validate all items in the array. More details
   * helpers.mergeSchemaObjs description
   * @param {array} arr
   * @returns {object|null}
   */


  _createClass(ToJsonSchema, [{
    key: "getCommonArrayItemSchema",
    value: function getCommonArrayItemSchema(arr, key) {
      var _this = this;

      var schemas = arr.map(function (item) {
        return _this.getSchema(item, key);
      }); // schemas.forEach(schema => console.log(JSON.stringify(schema, '\t')))

      return schemas.reduce(function (acc, current) {
        return helpers.mergeSchemaObjs(acc, current);
      }, schemas.pop());
    }
  }, {
    key: "getObjectSchemaDefault",
    value: function getObjectSchemaDefault(obj) {
      var _this2 = this;

      var schema = {
        type: 'object'
      };
      var objKeys = Object.keys(obj);

      if (objKeys.length > 0) {
        schema.properties = objKeys.reduce(function (acc, propertyName) {
          acc[propertyName] = _this2.getSchema(obj[propertyName], propertyName); // eslint-disable-line no-param-reassign

          return acc;
        }, {});
      }

      return schema;
    }
  }, {
    key: "getObjectSchema",
    value: function getObjectSchema(obj, key) {
      if (this.options.objects.preProcessFnc) {
        return this.options.objects.preProcessFnc(obj, this.getObjectSchemaDefault, key);
      }

      return this.getObjectSchemaDefault(obj);
    }
  }, {
    key: "getArraySchemaMerging",
    value: function getArraySchemaMerging(arr, key) {
      var schema = {
        type: 'array'
      };
      var commonType = getCommonArrayItemsType(arr);

      if (commonType) {
        schema.items = {
          type: commonType
        };

        if (commonType !== 'integer' && commonType !== 'number') {
          var itemSchema = this.getCommonArrayItemSchema(arr, key);

          if (itemSchema) {
            schema.items = itemSchema;
          }
        } else if (this.options.required) {
          schema.items.required = true;
        }
      }

      return schema;
    }
  }, {
    key: "getArraySchemaNoMerging",
    value: function getArraySchemaNoMerging(arr, key) {
      var schema = {
        type: 'array'
      };

      if (arr.length > 0) {
        schema.items = this.getSchema(arr[0]);
      }

      return schema;
    }
  }, {
    key: "getArraySchemaTuple",
    value: function getArraySchemaTuple(arr, key) {
      var _this3 = this;

      var schema = {
        type: 'array'
      };

      if (arr.length > 0) {
        schema.items = arr.map(function (item) {
          return _this3.getSchema(item);
        });
      }

      return schema;
    }
  }, {
    key: "getArraySchemaUniform",
    value: function getArraySchemaUniform(arr, key) {
      var schema = this.getArraySchemaNoMerging(arr);

      if (arr.length > 1) {
        for (var i = 1; i < arr.length; i++) {
          if (!isEqual(schema.items, this.getSchema(arr[i]))) {
            throw new Error('Invalid schema, incompatible array items');
          }
        }
      }

      return schema;
    }
  }, {
    key: "getArraySchema",
    value: function getArraySchema(arr, key) {
      if (arr.length === 0) {
        return {
          type: 'array'
        };
      }

      if (this.options.arrays.preProcessFnc) {
        switch (this.options.arrays.mode) {
          case 'all':
            return this.options.strings.preProcessFnc(arr, this.getArraySchemaMerging, key, mode);

          case 'first':
            return this.options.strings.preProcessFnc(arr, this.getArraySchemaNoMerging, key, mode);

          case 'uniform':
            return this.options.strings.preProcessFnc(arr, this.getArraySchemaUniform, key, mode);

          case 'tuple':
            return this.options.strings.preProcessFnc(arr, this.getArraySchemaTuple, key, mode);

          default:
            throw new Error("Unknown array mode option '".concat(this.options.arrays.mode, "'"));
        }

        return;
      } else {
        switch (this.options.arrays.mode) {
          case 'all':
            return this.getArraySchemaMerging(arr, key);

          case 'first':
            return this.getArraySchemaNoMerging(arr, key);

          case 'uniform':
            return this.getArraySchemaUniform(arr, key);

          case 'tuple':
            return this.getArraySchemaTuple(arr, key);

          default:
            throw new Error("Unknown array mode option '".concat(this.options.arrays.mode, "'"));
        }
      }
    }
  }, {
    key: "getStringSchemaDefault",
    value: function getStringSchemaDefault(value) {
      var schema = {
        type: 'string'
      };

      if (!this.options.strings.detectFormat) {
        return schema;
      }

      var index = filteredFormats.findIndex(function (item) {
        return helpers.isFormat(value, item);
      });

      if (index >= 0) {
        schema.format = filteredFormats[index];
      }

      return schema;
    }
  }, {
    key: "getStringSchema",
    value: function getStringSchema(value, key) {
      if (this.options.strings.preProcessFnc) {
        return this.options.strings.preProcessFnc(value, this.getStringSchemaDefault, key);
      }

      return this.getStringSchemaDefault(value);
    }
  }, {
    key: "commmonPostProcessDefault",
    value: function commmonPostProcessDefault(type, schema, value) {
      // eslint-disable-line no-unused-vars
      if (this.options.required) {
        return _objectSpread({}, schema, {
          required: true
        });
      }

      return schema;
    }
  }, {
    key: "objectPostProcessDefault",
    value: function objectPostProcessDefault(schema, obj) {
      if (this.options.objects.additionalProperties === false && Object.getOwnPropertyNames(obj).length > 0) {
        return _objectSpread({}, schema, {
          additionalProperties: false
        });
      }

      return schema;
    }
    /**
     * Gets JSON schema for provided value
     * @param value
     * @returns {object}
     */

  }, {
    key: "getSchema",
    value: function getSchema(value, key) {
      var type = helpers.getType(value);

      if (!type) {
        throw new Error("Type of value couldn't be determined");
      }

      var schema;

      switch (type) {
        case 'object':
          schema = this.getObjectSchema(value, key);
          break;

        case 'array':
          schema = this.getArraySchema(value, key);
          break;

        case 'string':
          schema = this.getStringSchema(value, key);
          break;

        default:
          schema = {
            type: type
          };
      }

      if (this.options.postProcessFnc) {
        schema = this.options.postProcessFnc(type, schema, value, this.commmonPostProcessDefault, key);
      } else {
        schema = this.commmonPostProcessDefault(type, schema, value);
      }

      if (type === 'object') {
        if (this.options.objects.postProcessFnc) {
          schema = this.options.objects.postProcessFnc(schema, value, this.objectPostProcessDefault, key);
        } else {
          schema = this.objectPostProcessDefault(schema, value);
        }
      }

      return schema;
    }
  }]);

  return ToJsonSchema;
}();

function toJsonSchema(value, options) {
  var tjs = new ToJsonSchema(options);
  return tjs.getSchema(value, '__ROOT__');
}

module.exports = toJsonSchema;