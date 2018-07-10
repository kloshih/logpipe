

const assert = require('assert');
const begin = require('begin');
const log = require('log');

const log2 = require('../lib/log.js');

describe("log", function() {
  this.timeout(60e3);

  it("should do something", function() {

    class FileTransport extends log2.Transport {

      attach(log2) {
        log('info', "file.attach: #gr[%s]", log2);
        log('info', "file.config: #byl[%s]", this.name);

        

      }
      detach(log2) {
        log('info', "file.detach: #gr[%s]", log2);
      }
      append(record) {
        log('info', "file.append: #gr[%s]", record);
        super.append(record);
      }
      write(record) {
        log('info', "file.write: #gr[%s]", record);
      }

    }
    log2.use(FileTransport);

    class SuperFormat extends log2.Format {
      format(record) {
        log('info', "super.format: #gr[%s]", record);
        return JSON.stringify(record);
      }
    }
    log2.use(SuperFormat);

    log2.configure({transports:'file?format=super&file=/var/log/${prog}-${gen}.log'});
    log2('info', "Test");
    log2.configure({transports:'file?format=super'});

    log2('info', "Test");

  });


});
