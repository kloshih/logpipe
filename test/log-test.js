/*
 * test/class-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');

var log = require('../lib/log.js');
//var log = require('../index.js');

describe("Log", function() {

  describe("Default logger", function() {

    it("has a default logger", function() {
      assert.ok(log);
      assert.ok(typeof(log), 'function');
    });

    it("can log", function() {
      log('info', "This is a %s", 'test');
    });

    it("can log with carets", function() {
      log('info', "^This is a %s", 'test');
    });

    it("supports expanding args", function() {
      log('info', "This is a %s", {type:'test'});
    });

    it("checks levels", function() {
      log('warn', "check");
    });

    it("checks levels", function() {
      assert.ok(log.logs('fatal'));
      assert.ok(log.logs('error'));
      assert.ok(log.logs('warn'));
      assert.ok(log.logs('info'));
      assert.ok(!log.logs('debug'));
      assert.ok(!log.logs('fine1'));
      assert.ok(!log.logs('fine2'));
      assert.ok(!log.logs('fine3'));
    });

  });




  describe("Checking log.loc()", function() {

    it("supports the right location", function() {
      var record = log.loc();
      assert.equal(record.file, 'log-test.js');
      console.log("record: " + JSON.stringify(record, null, "  "));
    });

  });

  describe("Checking log.maxLevel()", function() {

    it("can get max level", function() {
      var record = log.loc();
      var maxLevel = log.maxLevel(record);
      console.log("maxLevel " + maxLevel);
    });

  });

  describe("Using enter/leave", function() {


    it("supports enter/leave", function() {
      log.enter('info', "This is the entry");
      log('info', "This is indented");
      log.enter('info', "This is the entry");
      log('info', "This is indented");
      log.leave('info', "This is leave");
      log.leave('info', "This is leave");
    });

  });

});
