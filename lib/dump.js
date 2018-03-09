/*
 * dump.js
 *
 * @MARK: Module
 */

(function(root) {
  'use strict';

  /** Returns a string dump of describing the object
   *
   *  @param  object The object (optional)
   *  @param  opts The options (object, optional)
   *  @param  indent The current indentation (string, optional)
   *  @param  depth The current depth (numberp, optional)
   *  @MARK:  -dump()
   */
  function dump(object, opts, indent, depth) {
    // var dump = arguments.callee;
    if (!dump.ignoredKeys)
      dump.ignoredKeys = { _super:true, superkeys:true, className:true, klass:true, 'this':true, $self:true };
    if (!dump.typeMap)
      dump.ignoredKeys = { _super:true, superkeys:true, className:true, klass:true, 'this':true, $self:true };
    if (!opts) opts = {};
    if (!indent) indent = opts.indent || "";
    if (depth === undefined) depth = opts.depth !== undefined ? opts.depth : 5;
    if (!opts.maxlen) opts.maxlen = 80;
    function len(buf) { var len=0; for (var i=0,ic=buf.length; i<ic; i++) len+=buf[i].length; return len }
    var type = typeOf(object);
    if (depth < 0 || (opts.ntypes && opts.ntypes.contains(type))) {
      switch (type) { /* recurse types */
        case "array": return "[..]";
        case "jquery": return "$[..]";
        case "object":
          var klass = classOf(object);
          return klass == "object" ? "{..}" : klass + "()";
      }
    } else if (!opts.objects && type === 'object' && (object.klass || object.class || object.className)) {
      var string = object.toString();
      if (string === '[object Object]')
        string = object.constructor.name + '()';
      if (string === '[object Arguments]')
        string = object.constructor.name + '()';
      return string + '!!';
    }
    var output = [], text;
    switch (type) {
      case "jquery":
        output.push("$", dump(object.get(), opts, indent, depth));
        break;
      case "html":
        output.push("<", object.constructor.code().replace(/\[object HTML(\w+?)ElementConstructor\]/, "$1").toLowerCase());
        for (var i = 0; i < object.attributes.length; i++) {
          output.push(" ", object.attributes[i].name, "=\"", object.attributes[i].value, "\"");
        }
        output.push("/>");
        break;
      case "map":
      case "weakmap":
        /* translate a map into weakmap */
        var copy = {};
        object.forEach(function(val, key) {
          copy[key] = val;
        });
        object = copy, copy = null;
        /* fall through */

      case "object":
        if (object.jquery && object.ajax) {
          break;
        }

        var superkeys = object.superkeys || object.klass && object.klass.superkeys || object.class && object.class.superkeys;
        if (object.className)
          output.push(object.className);
        else if (object.klass)
          output.push(object.klass);
        else if (object.class)
          output.push(object.class);
        output.push("{");
        text = [];
        for (var key in object) {
          if (object.hasOwnProperty && !object.hasOwnProperty(key)) continue;
          var keyValue = object[key];
          if ((object.klass || object.class) && keyValue && keyValue.methodName !== undefined) continue;
          var keyType = typeOf(keyValue);
          if (superkeys && superkeys.indexOf(key) >= 0 || dump.ignoredKeys[key] || (keyType == "function" && (opts.mode == "object" || keyValue.member))) continue;
          if (opts.keys && opts.keys.indexOf(key) < 0) continue;
          if (opts.nkeys && opts.nkeys.indexOf(key) >= 0) continue;
          if (text.length > 0) text.push(", ");
          var keyText = key.match(/\W/) ? quote(key) : key;
          text.push(keyText, ":", dump(keyValue, opts, indent + "  ", depth-1));
          if (len(text) > opts.maxlen || text.indexOf("\n") >= 0) {
            text = null;
            break;
          }
        }
        if (text != null) {
          output.push(text.join(''), "}");
        } else {
          text = [];
          for (var key in object) {
            var keyValue = object[key];
            if ((object.klass || object.class) && keyValue && keyValue.methodName !== undefined) continue;
            var keyType = typeOf(keyValue);
            if (superkeys && superkeys.indexOf(key) >= 0 || dump.ignoredKeys[key] || (keyType == "function" && (opts.mode == "object" || keyValue.member))) continue;
            if (opts.keys && opts.keys.indexOf(key) < 0) continue;
            if (opts.nkeys && opts.nkeys.indexOf(key) >= 0) continue;
            if (text.length > 0) text.push(",");
            text.push("\n", indent, "  ", key, ": ", dump(keyValue, opts, indent + "  ", depth-1));
          }
          output.push(text.join(''), "\n", indent, "}");
        }
        break;
      case "array":
        output.push("[");
        if (object.__iid !== undefined)
          output.push(object.__iid, ':');
        text = [];
        for (var i = 0; i < object.length; i++) {
          if (i > 0) text.push(', ');
          text.push(dump(object[i], opts, indent + "  ", depth-1));
          if (len(text) > opts.maxlen || text.indexOf("\n") >= 0) {
            text = null;
            break;
          }
        }
        if (text != null) {
          output.push(text.join(''), "]");
        } else {
          for (var i = 0; i < object.length; i++) {
            if (i > 0) output.push(',');
            output.push("\n", indent, "  ", opts.arrayIndexes ? i + '. ' : '', dump(object[i], opts, indent + "  ", depth-1));
          }
          output.push("\n", indent, "]");
        }
        if (opts.props) {
          var props = {}, count = 0;
          for (var key in object) {
            if (parseInt(key).toString() !== key && object.hasOwnProperty(key)){
              props[key] = object[key];
              count++;
            }
          }
          if (count > 0)
            output.push(dump(props, opts, indent + "  ", depth));
        }
        break;
      case "arguments":
        throw new Error("arguments: " + object);
        break;
      case "function":
        output.push(object.toString().replace(/ *\{[^\0]*/m, ""));
        break;
      case "null":
        output.push("null");
        break;
      case "undefined":
        output.push("undefined");
        break;
      case "buffer":
        var string = object.toString();
        string = quote(ellipses(string, 50));
        string = string.substring(1, string.length - 1);
        output.push('buffer[' + string + ']');
        break;
      case "string":
        var string = object;
        if (opts.ellipses)
          string = ellipses(string, opts.ellipses);
        output.push(quote(string));
        break;
      case "date":
        try {
        output.push(object.toISOString());
        } catch (error) {
          console.log("Failed to encode date: %s", object);
        }
        break;
      default:
        try {
          var string = object.toString();
          if (string === '[object Object]')
            string = object.constructor.name + '()';
          output.push(string);
        } catch(error) {
          output.push("(", type, ")<error: ", error, ">");
        }
        break;
    }
    return output.join('');
  }

  /** Returns the type of the <i>value</i>. The possible types returned are:
   *  "null", "object", "array", "string", "number", "regexp" or the name of
   *  the user constructor.
   *
   *  @param  value The value (optional)
   *  @return The type of the <i>value</i>
   *  @author K. Lo Shih <lo@readyon.com>
   *  @since  1.0
   *  @MARK:  -typeOf()
   */
  function typeOf(value) {
    var type = typeof(value);
    if (value === null) {
      type = 'null';
    } else if (value === undefined) {
      type = 'undefined';
    } else if (type === 'object' && value.jquery != undefined) {
      type = 'jquery';
    } else if (type === 'function' && value.compile && value.exec) {
      type = 'regexp';
    } else if (type === 'function' && value.className !== undefined && value.methodName === undefined) {
      type = 'class';
    } else if (Array.isArray(value)) {
      type = 'array';
    } else if (type === 'object' && (value.klass === undefined || value.class === undefined) && typeof(value.constructor) == 'function') {
      var constructor = value.constructor;
      type = constructor.typeName || (constructor.typeName = (constructor.name || constructor.toString().replace(/\s*function (\w+)[^\0]*/m, '$1').replace(/function \(.*\)[^\0]*/m, 'object').replace(/\[object HTML(\w+?)Element(?:Constructor)?\]/, 'html')).toLowerCase());
    }
    return type;
  }

  /** Returns the type of the <i>value</i>. The possible types returned are:
   *  "null", "object", "array", "string", "number", "regexp" or the name of
   *  the user constructor.
   *
   *  @param  value The value (optional)
   *  @return The type of the <i>value</i>
   *  @author K. Lo Shih <lo@readyon.com>
   *  @since  1.0
   *  @MARK:  -classOf()
   */
  function classOf(value) {
    var type = typeOf(value);
    if (type === "object")
      return value.klass && value.klass.className || value.class && value.class.className || type;
    if (type === "class")
      return value.className;
    return type;
  }

  /** Quotes the _string_ with the given _quote_ and _escape_ characters.
   *
   *  @param  string The string ({string}, optional)
   *  @param  quote The quote char ({string}, defaults to '"')
   *  @param  escape The escape char ({string}, defaults to '\\')
   *  @return The quoted form ({string})
   *  @MARK:  -quote()
   */
  function quote(string, quote, escape) {
    if (string === null || string === undefined) return null;
    if (!quote) quote = '"';
    if (!escape) escape = '\\';
    var text = quote;
    for (var i = 0, ic = string.length; i < ic; i++) {
      var c = string.charAt(i);
      switch (c) {
        case "\t": text += escape + "t"; break;
        case "\r": text += escape + "r"; break;
        case "\n": text += escape + "n"; break;
        case escape: text += escape + escape; break;
        case quote: text += escape + quote; break;
        default:
          var cc = string.charCodeAt(i);
          if (cc >= 32 && cc <= 126)
            text += c;
          else {
            var ct = cc.toString(16);
            if (ct.length < 2)
              ct = '0' + ct;
            text += '\\x' + ct;
          }
      }
    }
    text += quote;
    return text;
  }

  /** Returns a string with ellipses
   *
   *  @param  text The text ({string}, optional)
   *  @param  maxlen The maximum length ({int}, optional)
   *  @param  ellipses The ellpses to use ({string}, default `..`)
   *  @return The ellipsisized string (non-null)
   *  @since  1.0
   *  @MARK:  -ellipses()
   */
  function ellipses(text, maxlen, ellipses) {
    if (!text || !maxlen || text.length <= maxlen) {
      return text;
    } else {
      ellipses || (ellipses = '..');
      return text.substring(0, maxlen - ellipses.length) + ellipses;
    }
  }

  /** Generates a hex dump of the given *buffer* with the given options:
   *
   *  - `width` (number, default 64) - Number of characters per line
   *  - `word` (number, default 4) - Number of characters per word
   *  - `color` (string, default 'gr') - A named color
   *  - `indicator` (string, default '-') - A direction indicator
   *
   *  @param  buffer The data buffer ({buffer}, required)
   *  @param  [options] The options ({object], optional)
   *  @return The hex dump text ({string}, non-null)
   *  @since  1.0
   *  @MARK:  -hexdump()
   */
  function hexdump(buffer, options) {
    var indexColor = options && options.color || 'gr';
    var indicator = options && options.indicator || '-';
    var select = options && options.select;
    var chars = hexdump.chars || (hexdump.chars = {});
    var length = options && options.length || buffer.length;
//  0000: 0001 0203 0405 0607 0809 0a0b 0c0d 0e0f abcdefghijklmnop
    var text = [];
    var toIndex = function(i) {
      var x = '   ' + i.toString();
      return x.substring(x.length - 4);
    };
    var hex = [], toHex = function(byte) {
      var x = byte.toString(16);
      if (x.length === 1) x = '0' + x;
      return x;
    };
    var chr = [], toChr = function(byte) {
      switch (byte) {
        case 9:   return '#bbk[\\t]';
        case 10:  return '#bbk[\\n]';
        case 13:  return '#bbk[\\r]';
        default:  if (byte < 32 || byte >= 126) {
                    return '  ';
                  } else {
                    return ' ' + (chars[byte] || (chars[byte] = String.fromCharCode(byte)));
                  }
      }
    };
    var perline = options && options.width || 64,
        word = options && options.word || 4;
    var hexwidth = perline * 2 + perline / word + 1;
    var lastColor = null;
    var selected = false;
    for (var i = 0, ic = length; i < ic; i++) {
      var byte = buffer.readUInt8(i);
      var printable = 32 <= byte && byte < 126;
      var color = byte === 0 ? 'bk' : byte < 16 ? 'bbk' : printable ? 'bwh' : 'wh';
      if ((i % perline) === 0) {
        if (i > 0)
          text.push('\n');
        if (i == 0) {
          text.push(_.sprintf('#%s[%5d %1.1s]', indexColor, length, indicator));
        } else {
          text.push(' #' + indexColor + '[' + toIndex(i) + ']  ');
        }
        hex.length = chr.length = 0;
      }
      if ((i % word) === 0) hex.push(' '), chr.push(' ');
      if (color != lastColor) {
        if (lastColor)
          hex.push(']');
        if (color)
          hex.push('#', color, '[');
        lastColor = color;
      }
      var shouldSelect = select && select[0] <= i && i < select[1];
      // _.log('info', "#bbl[Select: i=%s, select=%s, selected=%s, shouldSelect=%s]", i, select, selected, shouldSelect);
      if (!selected && shouldSelect)
        hex.push('\x1b[4m'), selected = true;
      else if (selected && !shouldSelect)
        hex.push('\x1b[24m'), selected = false;
      hex.push(toHex(byte));
      chr.push(toChr(byte));
      if ((i % perline) == perline - 1) {
        text.push(_.sprintf('%-'+hexwidth+'s%s%s\n       %s', hex.join(''), lastColor ? ']' : '', selected ? '\x1b[24m' : '', chr.join('')));
        hex.length = chr.length = 0;
        lastColor = null;
        selected = false;
      }
    }
    if (hex.length > 0) {
      if (lastColor) hex.push(']');
      if (selected) hex.push('\x1b[24m');
      text.push(_.sprintf('%-'+hexwidth+'s\n       %s', hex.join(''), chr.join('')));
      hex.length = chr.length = 0;
    }
    return text.join('');
  }

  dump.typeOf = typeOf;
  dump.classOf = classOf;
  dump.quote = quote;
  dump.ellipses = ellipses;
  dump.hexdump = hexdump;

  /*
   * Export to CommonJS and global.
   */
  if (typeof(module) === 'object') {
    module.exports = dump;
  } else {
    var previous = root.dump;
    root.dump = dump;
    dump.noConflict = function() { root.dump = previous; return dump; };
  }
  return dump;

  module.exports = dump;

})(this);

//
