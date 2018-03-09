/*
 * colorize.js
 *
 * @MARK: Module
 */

(function(root) {

// https://github.com/Marak/colors.js/blob/master/colors.js
// https://github.com/mattpat/colorize/blob/master/lib/colorize.js

var colors = {

  bold:           { ansi:['\x1b[1m',  '\x1b[22m'], html:['<b>', '</b>'] },
  italic:         { ansi:['\x1b[3m',  '\x1b[23m'], html:['<i>', '</i>'] },
  underline:      { ansi:['\x1b[4m',  '\x1b[24m'], html:['<u>', '</u>'] },
  inverse:        { ansi:['\x1b[7m',  '\x1b[27m'],
                    html:['<b>', '</b>'] },
  ul: 'underline',
  iv: 'inverse',
  it: 'italic',
  bo: 'bold',
  '*': 'bold',
  '_': 'underline',

  default:        { ansi:['\x1b[39m', '\x1b[39m'], html:{color:'inherit'},
                    css:{color:'#f00'} },
  black:          { ansi:['\x1b[30m', '\x1b[39m'], html:{color:'#000'},
                    css:{color:'#ccc'} },
  red:            { ansi:['\x1b[31m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#990000'} },
  green:          { ansi:['\x1b[32m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#009200'} },
  yellow:         { ansi:['\x1b[33m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#4E4E00'} },
  blue:           { ansi:['\x1b[34m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#007FCD'} },
  magenta:        { ansi:['\x1b[35m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#FF65FF'} },
  cyan:           { ansi:['\x1b[36m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#2CAFB8'} },
  white:          { ansi:['\x1b[37m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#666'} },
  df: 'default',
  bk: 'black',
  rd: 'red',
  gr: 'green',
  yl: 'yellow',
  bl: 'blue',
  mg: 'magenta',
  cy: 'cyan',
  wh: 'white',

  brightblack:    { ansi:['\x1b[90m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#999'} },
  brightred:      { ansi:['\x1b[91m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#E50000'} },
  brightgreen:    { ansi:['\x1b[92m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#00D100'} },
  brightyellow:   { ansi:['\x1b[93m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#9C9C00'} },
  brightblue:     { ansi:['\x1b[94m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#2EAFFF'} },
  brightmagenta:  { ansi:['\x1b[95m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#E500E5'} },
  brightcyan:     { ansi:['\x1b[96m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#007F7F'} },
  brightwhite:    { ansi:['\x1b[97m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#333'} },
  bbk: 'brightblack',
  brd: 'brightred',
  bgr: 'brightgreen',
  byl: 'brightyellow',
  bbl: 'brightblue',
  bmg: 'brightmagenta',
  bcy: 'brightcyan',
  bwh: 'brightwhite',

  gray: 'brightwhite',
  gy:   'brightwhite',

  defaultbg:      { ansi:['\x1b[49m', '\x1b[49m'], html:{color:'inherit'} },
  blackbg:        { ansi:['\x1b[40m', '\x1b[49m'], html:{color:'#000'} },
  redbg:          { ansi:['\x1b[41m', '\x1b[49m'], html:{color:'#f00'} },
  greenbg:        { ansi:['\x1b[42m', '\x1b[49m'], html:{color:'#f00'} },
  yellowbg:       { ansi:['\x1b[43m', '\x1b[49m'], html:{color:'#f00'} },
  bluebg:         { ansi:['\x1b[44m', '\x1b[49m'], html:{color:'#f00'} },
  magentabg:      { ansi:['\x1b[45m', '\x1b[49m'], html:{color:'#f00'} },
  cyanbg:         { ansi:['\x1b[46m', '\x1b[49m'], html:{color:'#f00'} },
  whitebg:        { ansi:['\x1b[47m', '\x1b[49m'], html:{color:'#f00'} },
  dfbg: 'defaultbg',
  bkbg: 'blackbg',
  rdbg: 'redbg',
  grbg: 'greenbg',
  ylbg: 'yellowbg',
  blbg: 'bluebg',
  mgbg: 'magentabg',
  cybg: 'cyanbg',
  whbg: 'whitebg',

  brightblackbg:  { ansi:['\x1b[100m', '\x1b[49m'], html:{color:'#f00'} },
  brightredbg:    { ansi:['\x1b[101m', '\x1b[49m'], html:{color:'#f00'} },
  brightgreenbg:  { ansi:['\x1b[102m', '\x1b[49m'], html:{color:'#f00'} },
  brightyellowbg: { ansi:['\x1b[103m', '\x1b[49m'], html:{color:'#f00'} },
  brightbluebg:   { ansi:['\x1b[104m', '\x1b[49m'], html:{color:'#f00'} },
  brightmagentabg:{ ansi:['\x1b[105m', '\x1b[49m'], html:{color:'#f00'} },
  brightcyanbg:   { ansi:['\x1b[106m', '\x1b[49m'], html:{color:'#f00'} },
  brightwhitebg:  { ansi:['\x1b[107m', '\x1b[49m'], html:{color:'#f00'} },
  bbkbg: 'brightblackbg',
  brdbg: 'brightredbg',
  bgrbg: 'brightgreenbg',
  bylbg: 'brightyellowbg',
  bblbg: 'brightbluebg',
  bmgbg: 'brightmagentabg',
  bcybg: 'brightcyanbg',
  bwhbg: 'brightwhitebg',

};
var tokenRe = /#(\w+)\[|(\x1b\[|\[|\])/g,
    browser = typeof(window) !== 'undefined';

function colorize() {
  if (browser)
    return htmlize.apply(this, arguments);
  else
    return ansiize.apply(this, arguments);
};
colorize.ansiize = ansiize;
colorize.htmlize = htmlize;
colorize.browserize = browserize;
colorize.tokenize = tokenize;
colorize.plain = plain;
colorize.hbar = hbar;

/** Converts the *text* into an ANSI escape sequences.
 *
 *  @param  text The text ({string}, optional)
 *  @return The colorized text ({string})
 *  @since  1.0
 *  @MARK:  -()
 */
function ansiize(text) {
  if (!text || text.indexOf('[') < 0)
    return text;
  var out = [], stack = [], index = 0;
  for (var match; (match = tokenRe.exec(text)); ) {
// console.log("index=" + index + ", match=" + match.index + ": " + _.dump(match));
    // log('info', "match: %s", match);
    var start = match[1],
        color = colors[start],
        token = start ? '[' : match[2];
    if (index < match.index)
      out.push(text.substring(index, match.index));
    if (color) {
      var alias = colors[color];
      if (alias) color = alias;
      stack.push(color);
      out.push(color.ansi[0]);
    } else {
//console.log("token: " + _.quote(token));
      switch (token) {
        case '[':
          stack.push(null);
          out.push(token);
          break;
        case ']':
          color = stack.pop();
          if (color) {
            var end = color.ansi[1];
            /* If this is a color, search for the next color to restore from the
             * stack. Colors are those whose closing ansi code is "\x1b[39m". */
            switch (end) {
              case '\x1b[39m':
                for (var i = stack.length - 1; i >= 0; i--) {
                  var c = stack[i];
                  if (c && c.ansi[1] === '\x1b[39m') {
                    end = c.ansi[0];
                    break;
                  } else {
// log('info', "i=%d, c=%s, c.ansi[1]", i, _.dump(c), c.ansi[1]);
                  }
                }
                break;
            }
            out.push(end);
          } else {
            out.push(token);
          }
          break;
        default:
          out.push(token);
      }
    }
    index = match.index + match[0].length;
  }
  if (index < text.length)
    out.push(text.substring(index));
  return out.join('');
}

function ansi(text) {
  return tokenize(text, function(token, color, stack) {
    switch (token) {
      case '[':
        return color.ansi[0];
      case ']':
        var end = color.ansi[1];
        if (end === '\x1b[39m') {
          for (var i = stack.length - 1; i >= 0; i--) {
            var c = stack[i];
            if (c && c.ansi[1] === '\x1b[39m') {
              end = c.ansi[0];
            }
          }
        }
        return end;
    }
  })
}

function plain(text) {
  return tokenize(text, function(token, color, stack) {
  })
}



/** Strips color information from *text*
 *
 *  @param  text The text ({string}, optional)
 *  @return The plain text ({string})
 *  @since  1.0
 *  @MARK:  -()
 */
function plain(text) {
  if (!text || text.indexOf('[') < 0)
    return text;
  var out = [], stack = [], index = 0;
  for (var match; (match = tokenRe.exec(text)); ) {
// console.log("index=" + index + ", match=" + match.index + ": " + _.dump(match));
    // log('info', "match: %s", match);
    var start = match[1],
        color = colors[start],
        token = start ? '[' : match[2];
    if (index < match.index)
      out.push(text.substring(index, match.index));
    if (color) {
      var alias = colors[color];
      if (alias) color = alias;
      stack.push(color);
      //out.push(color.ansi[0]);
    } else {
//console.log("token: " + _.quote(token));
      switch (token) {
        case '[':
          stack.push(null);
          out.push(token);
          break;
        case ']':
          color = stack.pop();
          if (color) {
            var end = color.ansi[1];
            /* If this is a color, search for the next color to restore from the
             * stack. Colors are those whose closing ansi code is "\x1b[39m". */
            switch (end) {
              case '\x1b[39m':
                for (var i = stack.length - 1; i >= 0; i--) {
                  var c = stack[i];
                  if (c && c.ansi[1] === '\x1b[39m') {
                    end = c.ansi[0];
                    break;
                  } else {
// log('info', "i=%d, c=%s, c.ansi[1]", i, _.dump(c), c.ansi[1]);
                  }
                }
                break;
            }
            // out.push(end);
          } else {
            out.push(token);
          }
          break;
        default:
          out.push(token);
      }
    }
    index = match.index + match[0].length;
  }
  if (index < text.length)
    out.push(text.substring(index));
  return out.join('');
}

/** <#docs#>
 *
 *  @param    (, required)
 *  @param    (, optional)
 *  @param  callback A completion callback ({function(err,..)}, optional)
 *  @return
 *  @see
 *  @since  1.0
 *  @MARK:  -()
 */
function htmlize(text) {
  return '<span>' + tokenize(text, function(token, color, stack) {
    var css = {};
    for (var i = 0, ic = stack.length; i < ic; i++) {
      var color = stack[i];
      if (color && color.css)
        Object.assign(css, color.css)
    }
    var text = [];
    for (var k in css) {
      var v = css[k];
      text.push(k, ':', v, ';');
    }
    return '</span><span style="' + text.join('') + '">'
  }) + '</span>';
}

/** <#docs#>
 *
 *  @param    (, required)
 *  @param    (, optional)
 *  @param  callback A completion callback ({function(err,..)}, optional)
 *  @return
 *  @see
 *  @since  1.0
 *  @MARK:  -()
 */
function browserize(text) {
  var parts = [null];
  parts[0] = tokenize(text, function(token, color, stack) {
    var css = {};
    for (var i = 0, ic = stack.length; i < ic; i++) {
      var color = stack[i];
      if (color && color.css)
        Object.assign(css, color.css)
    }
    var text = [];
    for (var k in css) {
      var v = css[k];
      text.push(k, ':', v, ';');
    }
    parts.push(text.join(''));
    return '%c';
  })
  return parts;
}

/** <#docs#>
 *
 *  @param    (, required)
 *  @param    (, optional)
 *  @param  callback A completion callback ({function(err,..)}, optional)
 *  @return
 *  @see
 *  @since  1.0
 *  @MARK:  -()
 */
function tokenize(text, tokenizer) {
  if (!text || text.indexOf('[') < 0)
    return text;
  var out = [], stack = [], index = 0;
  for (var match; (match = tokenRe.exec(text)); ) {
      // console.log("index=" + index + ", match=" + match.index + ": " + _.dump(match));
    // log('info', "match: %s", match);
    var start = match[1],
        color = colors[start],
        token = start ? '[' : match[2];
    if (index < match.index)
      out.push(text.substring(index, match.index));
    if (color) {
      var alias = colors[color];
      if (alias) color = alias;
      stack.push(color);
      out.push(tokenizer(token, color, stack) || '');
    } else {
      //console.log("token: " + _.quote(token));
      switch (token) {
        case '[':
          stack.push(null);
          out.push(token);
          break;
        case ']':
          color = stack.pop();
          if (color) {
            var end = tokenizer(token, color, stack);
            out.push(end);
          } else {
            out.push(token);
          }
          break;
        default:
          out.push(token);
      }
    }
    index = match.index + match[0].length;
  }
  if (index < text.length)
    out.push(text.substring(index));
  return out.join('');
}

/** Returns a horizontal bar occupying *width* characters. This uses the unicode
 *  characters: \u258F - \u2588
 *
 *  @param  percent The percent ({number}, required)
 *  @param  width The width in characters ({number}, optional)
 *  @return The horizontal bar ({string}, non-null)
 *  @since  1.0
 *  @MARK:  -hbar()
 */
function hbar(percent, width, fullwidth) {
  var text = [];
  var cur = Math.round(Math.max(0, Math.min(1, percent)) * Math.max(1, width) * 5);
  for (var i = 0; i < width; i++) {
    if (cur >= 5) {
      text.push(hbar.full), cur -= 5;
    } else {
      text.push(hbar.chars.charAt(cur)), cur = 0;
      //if (!fullwidth)
      //  break;
    }
  }
  return text.join('');

  for (; cur >= 5; cur -= 5)
    text.push(hbar.full);
  text.push(hbar.chars.charAt(cur));
  for (var i = text.length; i < width; i++)
    text.push('+');
  return text.join('');
}
hbar.full = "\u258B";
hbar.chars = " \u258F\u258E\u258D\u258C";

if (typeof(module) !== 'undefined')
  module.exports = colorize;
else
  root.colorize = colorize;

})(this);
