/*
 * test/trace-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');
var ec = require('ec'), _ = ec._, log = ec.log;

var tracer = require('../lib/tracer.js');
var begin = require('begin');

describe("Log Tracer", function() {

  describe("Using Tracer", function() {

    class Calc {
      static check() {}
      add(a, b) { return a + b }
      mul(a, b) { if (a == 0) throw new Error("No zeros!"); return a * b }
    }
    class SuperCalc extends Calc {
      static check() { super.check() }
      mul(a, b, c) { return super.mul(a, b) * c }
      div(a, b) { return b == 0 ? 0 : super.mul(a, 1/b) }
    }

    it("should be able to trace", function() {
      var calc = new SuperCalc();
      console.log("calc 1 - bare supercalc");
      var res = calc.mul(2, 3, 4);
      assert.equal(res, 24)

      tracer.trace(SuperCalc, {supermethods:true});
      console.log("calc 2 - traced supercalc/calc");
      var res = calc.mul(3, 4, 5);
      assert.equal(res, 60)
      console.log("calc 2 - traced supercalc/calc with error");
      assert.throws(function() {
        var res = calc.mul(0, 1, 2);
      });

      console.log("check - traced supercalc/calc");
      SuperCalc.check();

      var calc2 = new Calc();
      console.log("calc 2 - bare calc2");
      calc2.mul(10, 20);
      tracer.trace(Calc, {supermethods:true});
      console.log("calc 2 - traced calc2");
      calc2.mul(11, 21);
      tracer.untrace(Calc);
      console.log("calc 2 - untraced calc2");
      calc2.mul(12, 22);

      console.log("calc 2 - traced calc");
      var res = calc.mul(3, 4, 5);

      tracer.untrace(SuperCalc);
      console.log("calc 3 - untraced supercalc");
      var res = calc.mul(3, 4, 5);
      assert.equal(res, 60)
    });

  });

});
