

const assert = require('assert');
const begin = require('begin');
const log = require('log');

const log2 = require('../lib/log.js');
const FileTransport = require('../lib/log-file.js');

describe("log", function() {
  this.timeout(60e3);

  it("should do something", function() {

    /*  */
    class SuperFormat extends log2.Format {
      format(record) {
        log('info', "super.format: #gr[%s]", record);
        return JSON.stringify(record);
      }
    }
    log2.use(SuperFormat);

    log2.configure({transports:'file?format=full&file=/tmp/log/${prog}-${date:%25Y-%25m-%25d}${gen:-}.log&maxgen=5&maxsize=1&autoroll=daily'});
    log2('info', "Test");
    log2('info', "Test");
    log2('info', "Test");
    log2('info', "Test");
    log2('info', "Test");

  });

  it.skip("should be able to work with generations", function(done) {

    var transport = new FileTransport({
      name: 'file',
      url: '..',
      params: {
        file: '/tmp/log/${id}${gen:-}.log',
        maxsize: 1,
      },
      format: 'compact',
    });
    transport.attach();

    log('info', "#bcy[file] #wh[file #byl[%s] props #byl[%s]]", transport.currentFile, transport.currentProps);
    transport.roll();
    // transport.roll();
    // transport.roll();
    // transport.roll();
    // transport.roll();
    // transport.roll();
    // transport.roll();
    // transport.roll();
    // transport.roll();

    log('info', "roll using #gr[kill -HUP %s]", process.pid);

    setTimeout(done, 30e3);
    // done();

  });


});
