/*
 * test/colorize-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');

var colorize = require('../lib/colorize.js');
var log = require('../lib/log.js');

describe("colorize", function() {

  describe("hbars", function() {

    it("Drawing bars", function() {
      var count = 50; inc = 1.5;
      for (var i = 0; i < count; i += inc) {
        console.log(colorize.ansiize(log.sprintf('#gr[%s] %s', colorize.hbar(i / count, 10), i)));
      }
    });

  });

  describe("colorize", function() {
    it("doesn't touch normal text", function() {
      assert.equal(colorize("test"), "test");
    });
    it("colorizes green", function() {
      assert.equal(colorize("test #gr[green] text"), "test \x1b[32mgreen\x1b[39m text");
    });
    it("colorizes green + yellow", function() {
      var colorized = colorize("test #gr[green #yl[yellow] then green] text");
      log('info', "Colorized: %s", colorized);
      assert.equal(colorized, "test \x1b[32mgreen \x1b[33myellow\x1b[32m then green\x1b[39m text");
    });
    it("colorizes rainbow", function() {
      var colorized = colorize("#rd[r#yl[a#gr[i#cy[n#bl[b#mg[o#wh[w#bk[!]w]o]b]n]i]a]r]");
      log('info', "Colorized: %s", colorized);
    });
    it("color test", function() {
      console.log(colorize(
        "df\n" +
        "#bk[bk] #bbk[bbk]\n" +
        "#rd[rd] #brd[brd]\n" +
        "#gr[gr] #bgr[bgr]\n" +
        "#yl[yl] #byl[byl]\n" +
        "#bl[bl] #bbl[bbl]\n" +
        "#mg[mg] #bmg[bmg]\n" +
        "#cy[cy] #bcy[bcy]\n" +
        "#wh[wh] #bwh[bwh]"
      ));
    });
  });

  describe("Plain text", function() {
    it("works with plain()", function() {
      debugger;
      assert.equal(colorize.plain("#gr[Test #yl[yellow #df[brackets: ]]#gr[[]]]"), "Test yellow brackets: []");
    });
  });

  describe("Can tokenize", function() {

    it("should be able to tokenize", function() {
      var result = colorize.tokenize("This is #gr[green]!", function(token, color, stack) {
        // console.log("token: token=" + token + ", color=" + log.dump(color) + ", stack=" + log.dump(stack));
      })
      console.log("result: " + result);

      var result = colorize.tokenize("#wh[This is #gr[green]!]", function(token, color, stack) {
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
        return color.ansi[0];
        return "+";
      })
      console.log("result: " + result);
    });

    it("should be able to browserize", function() {
      var result = colorize.browserize("This is #red[red]!");
      console.log("result: ", result);
    });

    it("should be able to htmlize", function() {
      var result = colorize.htmlize("This is #red[red]!");
      console.log("result: ", result);
    });

  });

});
