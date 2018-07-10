(function(root) {

var log = require('./log.js');
var fs = require('fs');
var path = require('path');
var util = require('util');
var colorize = require('./colorize.js');


function FileTransport(conf) {
  log.Transport.apply(this, arguments)
  // console.log(conf);
}
util.inherits(FileTransport, log.Transport);

//FileTransport.prototype = Object.create(log.Transport);

FileTransport.prototype.attach = function() {
  // console.log("FileTransport.attach() config=" + this.config);

  this.maxgen = this.params.maxgen || 5;
  this.maxsize = this.params.maxsize || -1;
  this.autoroll = this.params.autoroll || false;
  this.dirmode = parseInt(this.params.dirmode || '755', 8);
  this.filemode = parseInt(this.params.mode || '644', 8);
  this.open();

  /* Install a signal handler for rolling log files. */
  process.on('SIGHUP', this.signalHandler = () => {
    this.roll();
  });

};

FileTransport.prototype.detach = function() {
  this.close();
  if (this.signalHandler) {
    process.removeListener('SIGHUP', this.signalHandler);
    this.signalHandler = null;
  }
};

FileTransport.prototype.open = function() {
  var tmpl = this.params.file;

  if (this.cur)
    throw new Error("File already opened");

  /* By default, we append to the existing file. However, if we
   * 'autoroll=open', then we will automatically roll upon open, meaning that
   * each process has its own file. */
  if (this.autoroll == 'open')
    this.roll();

  var cur = {open:false, size:0};
  cur.props = Object.assign({gen:0, date:new Date()}, this.params);
  cur.file = this.fileForProps(cur.props);
  mkdirsSync(path.dirname(cur.file));
  // console.log("Creating a file with path: " + cur.file);
  // cur.fd = fs.openSync(cur.file, 'a', this.filemode);
  // cur.stat = fs.fstatSync(cur.fd);
  // cur.size = cur.stat.size;

  cur.pending = [];
  cur.stream = fs.createWriteStream(cur.file, { flags:'a', encoding:'utf8', mode:this.filemode, autoClose:true });
  cur.stream.once('open', function() {
    // console.log("OPEN open=" + cur.open);
    cur.open = true;
    cur.stat = fs.statSync(cur.file);
    cur.size += cur.stat.size;
    // var pending = cur.pending;
    // cur.pending = null;
    // pending.forEach(function(buffer) {
    //   cur.stream.write(buffer);
    // });
  })
  // console.log("Opened log file:", cur);
  this.cur = cur;
}

FileTransport.prototype.close = function() {
  if (this.cur) {
    if (this.cur.fd) {
      fs.closeSync(this.cur.fd);
      this.cur.fd = undefined;
    }
    this.prev = this.cur;
    this.cur = null;
  }
}

FileTransport.prototype.write = function(line) {
  line = line + '\n';
  if (!this.cur)
    this.open();
  // console.log("this.cur.fd=", this.cur);
  var text = colorize.ansiize(line);
  var buffer = Buffer.from(text, 'utf8');
  this.cur.stream.write(buffer);
  // var okay = fs.write(this.cur.fd, buffer, function(err) {
  //   if (err)
  //     console.log("Failed to write", err.stack);
  // });

  /* Track the size of the log file. If we have a maxsize, and we've exceeded
   * it, then roll the file. */
  this.cur.size += buffer.length;
  if (this.maxsize > 0 && this.cur.size > this.maxsize) {
    this.roll();
  }
}

/** Rolls the given log file. If the current file already exists, then the file
 *  is moved to the next generation so long as the next
 *
 *
 */
FileTransport.prototype.roll = function(props) {
  /* If the file is still open, then close it */
  var opened = !!this.cur;
  this.close();

  /* */
  props = Object.assign({gen:0}, props || this.currentProps);
  var file = this.fileForProps(props);
  if (fs.existsSync(file)) {
    if (this.maxgen <= 0 || props.gen < this.maxgen) {
      props.gen++;
      var next = this.fileForProps(props);
      this.roll(props);
      // console.log("Moving generations: rename(" + file + ", " + next + ")");
      fs.renameSync(file, next);
    } else {
      // console.log("Removing aged file: unlink(" + file + ")");
      fs.unlinkSync(file);
      /* remove file */
    }
  }

  if (opened)
    this.open();
}

/** Returns the file name for the given *props*. The support props are:
 *
 * - `${id}` | `${prog}` - The application id, defaulting to
 *   `path.basename(process.argv[1])`
 * - `${date[:<format>]}` - The current date and time with an optional
 *    format
 * - `${gen:<prefix>}` - The file generation of the file.
 *
 *
 */
FileTransport.prototype.fileForProps = function(props) {
  var tmpl = this.params.file;
  var file = tmpl.replace(/\$\{(\w+)(?::([^\{\}]+)?)?\}/g, function(_, key, conf) {
    switch (key) {
      case 'id': case 'prog':
        return props.id || path.basename(process.argv[1]);
      case 'date': case 'time':
      // console.log('conf=[' + conf + ']');
        return log.strftime(conf || '%Y-%m-%dT%H:%M:%S', props.date || new Date());
      case 'gen': case 'generation':
        if (conf) {
          return props.gen == 0 ? '' : conf + props.gen;
        } else {
          return props.gen;
        }
      case 'pid':
        return props.pid || process.pid;
      default:
        return '(' + key + '?)';
    }
  });
  return file;
}

log.use(FileTransport);

module.exports = FileTransport;

/** Does `mkdir -p` synchronously
 */
function mkdirsSync(dir, mode) {
  // console.log("mkdirsSync: dir=" + dir + ", exists=" + fs.existsSync(dir));
  if (!fs.existsSync(dir)) {
    var parent = path.dirname(dir);
    mkdirsSync(parent, mode);
    fs.mkdirSync(dir, mode || this.dirmode);
  }
}



})(this)
