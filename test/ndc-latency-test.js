/*
 * test/ndc-latency-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

var assert = require('assert');
var ec = require('ec'), _ = ec._, log = ec.log;

var log = require('../lib/log.js');

require('ec/lib/debug').
//  trace(SomeClass).
//  trace(require('../lib/some_file.js')).
  toString();

describe("NDC Latency", function() {

//  var end = log.operation("#bbk[self] #bbl[{coll.name} {op} query #byl[{query}] opts #bbyl[{opts}]] #bbk[{active}]", {active:this, evid:req.evid, session:session, auth:auth, coll:coll, query:query, update:update, op:'findOne'});
//  self.coll.findOne(query, opts, end(function() {}));

  /*
   * Mongo:
   *   recv req:
   *     - T1 (ssid, rqid), (apid), {rc:'', op:'recv', rc:'-'}
   *   call 1:
   *     - T2 (ssid, rqid), (apid), {rc:'redis1:/urss', op:'get',
   *           ar:{key:'..'}, er:null, tm:T3-T2, cn:1}
   *     - T3
   *   call 2:
   *     - T4 (ssid, rqid), (apid), {rc:'mongo1:/risk-alb/rk.ur', op:'findOne',
   *           ar:{query:{..},sort:{..},w:..}, er:null, tm:T5-T4, cn:1}
   *     - T5
   *   send res:
   *     - T6
   *
   * {_id:{ssid:123}}
   */


});
