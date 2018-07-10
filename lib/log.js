/*
 * log.js
 *
 * @MARK: Module
 */

(function(root) {
  'use strict';

  var sprintf = require('sprintf').sprintf;
  var colorize = require('./colorize.js');
  var dump = require('./dump.js');
  var strftime = require('strftime');

  var slice = Array.prototype.slice;
  var platform = null;
  var empty = Object.freeze({});
  var tracer /* = require('./tracer.js') lazy */;

  // var compact = require('./format/compact.js');

  var env = {},
      pid = null,
      host = null,
      proc = null,
      ip = null,
      mac = null;
  if (typeof(process) !== 'undefined') {
    var os = require('os');
    env = process.env;
    pid = process.pid;
    host = os.hostname();
    proc = process.argv[1];
    proc && (proc = proc.replace(/.*\x2f/, ''));

    /* Find the network interface card */
    var ipnis = os.networkInterfaces();
    for (var key in ipnis) {
      var nis = ipnis[key];
      for (var i = 0, ic = nis.length; i < ic; i++) {
        var ni = nis[i];
        if (ni.internal) break;
        if (ni.family != 'IPv4') continue;
        ip = ni.address;
        mac = ni.mac;
        break;
      }
    }

  }
  var host = { nm:host, ip:ip, mac:mac, proc:proc, pid:pid };

  function log(level, format) {
    return log.recordv(1, 'log', slice.call(arguments))
  }

  var props = {

    maxLevels: {
      '*:*': 'warn',
    },

    transportConfigs: {},

    /** Configures the log.
     *
     *  @param  config ()
     */
    configure: function(config) {
      /* Configure the maxLevels levels */
      var configLevels = config && config.levels || env.LOGLEVEL || env.LOGLEVELS || 'warn';
      if (typeof(configLevels) == 'string') {
        var parsed = {};
        var parts = configLevels.trim().split(/\s*,\s*/);
        for (var p = 0, pc = parts.length; p < pc; p++) {
          var part = parts[p];
          var match = part.match(/^(?:(.+)=)?(\w+)$/);
          if (!match)
            throw new Error("Log config must be of the format, \"[[[<module>|*]:][<file>|*]=]<level>\", in config: " + configLevels);
          var spec = match[1] || '*:*',
              level = match[2];
          parsed[spec] = level;
        }
        configLevels = parsed;
      }
      this.maxLevels = {
        '*:*':'warn',
      };
      this.maxOverallPriority = levels['warn'];
      for (var spec in configLevels) {
        var level = configLevels[spec],
            prio = levels[level];
        if (spec == '*')
          spec = '*:*';
        if (!prio)
          throw new Error("Log does not support configured level, \"" + level + "\", in config: " + config);
        this.maxLevels[spec] = level;
        if (this.maxOverallPriority < prio)
          this.maxOverallPriority = prio;
      }
      maxLevelCache = {};
      // console.log("configure: maxLevels", this.maxLevels);

      /* Configure the transports */
      var configTransports = config && config.transports || env.LOGTRANSPORT || env.LOGTRANSPORTS || 'console?format=compact';
      if (typeof(configTransports) === 'string') {
        var parsed = {};
        var parts = configTransports.trim().split(/\s*;\s*/);
        for (var p = 0, pc = parts.length; p < pc; p++) {
          var part = parts[p];
          var match = part.match(/^(\w+)(?::[^\?]*)?(?:\?(.*))?$/);
          if (!match)
            throw new Error("Log tranpsort must be of the format, \"<transport>[:<opaque>][?<param>=<value>[&<param>=<value>]*]\", in config: " + configLevels);
          var params = {};
          (match[2] ? match[2].split('&') : []).forEach(function(piece) {
            var match = piece.match(/^(.*?)(?:=(.*))?$/)
            if (!match)
              throw new Error("Malformed query param: '" + piece + "'");
            var key = decodeURIComponent(match[1]),
                val = match[2] != null ? decodeURIComponent(match[2]) : '';
            params[key] = val.match(/^(-|\+|)\d+(\.\d+)?/) ? parseFloat(val) : val || true;
          });
          var conf = { name:match[1], url:match[0], params:params, format:params.format };
          delete(params.format)
          parsed[match[1]] = conf;
        }
        this.transportConfigs = parsed;
      }
      this.transports && this.transports.forEach(function(t) { t.detach(log) });
      this.transports = null;
      // console.log("configure: transportConfigs", this.transportConfigs);
    },

    logs: function(level, record) {
      return this._logs(1, level, record);
    },

    maxLevel: function(loc) {
      if (!loc)
        throw new Error("No loc");
      var maxLevel = maxLevelCache[loc.path];
      if (!maxLevel) {
        var config = this.maxLevels;
        var pkg = loc.pkg, file = loc.file;
        maxLevel = maxLevelCache[loc.path] = config[pkg + ':' + file] || config[pkg + ':*'] || config['*:' + file] || config['*:*'];
      }
      return maxLevel;
    },

    log: function(level, format) {
      return log.recordv(1, 'log', slice.call(arguments))
    },

    enter: function(level, format) {
      this.recordv(1, 'enter', slice.call(arguments));
      return stack.length - 1;
    },

    leave: function(level, format) {
      var args = slice.call(arguments);
      var depth = typeof(args[0]) === 'number' ? args.shift() : null;
      var record = depth == null ? stack.pop() : stack.splice(depth)[0];
      if (record && args.length > 0) {
        // console.log("leave record=", record);
        var interval = Date.now() - record.date.getTime();
        args[1] += " #bbk[- " + interval + " ms]";
        this.recordv(1, 'leave', args);
      }
      return stack.length;
    },

    loc: function(frame, error) {
      if (!frame || frame < 0)
        frame = 0;
      if (!error) {
        try {
          throw new Error()
        } catch (err) {
          error = err;
        }
      }
//      error || (error = new Error());
      var lines = error.stack.split('\n', frame + 3);
      var line = lines[lines.length - 1];

      var match, loc;
      if (match = line.match(/at (?:(.*) \()?((?:(.*\x2f)([^\x2f\n]+)(\x2f(lib|test|bin|conf)\x2f(?:.*\x2f)?))?(([^\x2f\n]+?)(?:\.([^\x2f\n]+))?)):(\d+):(\d+)\)?/)) {
        loc = {
          // name: match[1],
          source: match[2],
          prefix: match[3],
          pkg: match[4],
          subpath: match[5],
          kind: match[6],
          file: match[7],
          // basename: match[8],
          // extname: match[9],
          line: match[10] ? parseInt(match[10]) : null,
          col: match[11] ? parseInt(match[11]) : null,
        };
      }
      // "loc@http://localhost:8080/index_bundle.js:11371:26"
      // "recordv@http://localhost:8080/index_bundle.js:11418:25"
      // "Session@http://localhost:8080/index_bundle.js:21084:23"
      // "http://localhost:8080/index_bundle.js:21105:26"
      // "__webpack_require__@http://localhost:8080/index_bundle.js:20:34"

      else if (match = line.match(/at (?:(.*) \x28)?((https?:\x2f\x2f[^\x2f]+\x2f)(.*?\x2f)?([^\x2f]+)):(\d+):(\d+)/)) {
        /* Chrome */
        loc = {
          // name: match[1],
          source: match[2],
          prefix: match[3],
          pkg: 'browser',
          subpath: match[4],
          kind: null,
          file: match[5],
          line: match[6] ? parseInt(match[6]) : null,
          col: match[7] ? parseInt(match[7]) : null,
        };
      }
      else if (match = line.match(/at (?:(.*) \x28)?<anonymous>/)) {
        /* Chrome */
        loc = {
          // name: match[1],
          source: 'unknown',
          prefix: 'unknown',
          pkg: 'builtin',
          subpath: null,
          kind: null,
          file: '<builtin>',
          line: null,
          col: null,
        };
      }
      else {
        throw new Error("UNSUPPORTED FORMAT: " + line + "\n" + error.stack);
      }
      return loc;
    },

//    LOGSINK = "console:?level=info&format=compact"
//    LOGSINK = "file:/var/log/es/rk:file.log?level=info,count=5&time=0:00&size=1MB&zip=gzip&format=compact"
//    LOGSINK = "mongo://host/db/coll?level=info"

    _logs: function(frame, level, record) {
      var loc = record && record.loc || this.loc(frame + 1);
//      if (!record)
//        record = this.loc(frame + 1);
      var prio = levels[level];
      if (!prio) throw new Error("Unsupported level: " + level);
      var maxLevel = this.maxLevel(loc);
      var maxPrio = levels[maxLevel];
      return prio <= maxPrio;
    },

    recordv: function(frame, type, args) {
      var level = args.shift();
      if (Array.isArray(level))
        frame += level[1], level = level[0];
      var prio = levels[level];
// console.log("prio=" + prio + ", this.maxOverallPriority=" + this.maxOverallPriority);
//      if (prio > this.maxOverallPriority)
//        return false;
      var loc = this.loc(frame + 1);
// console.log("loc=", loc);
      var maxLevel = this.maxLevel(loc);
      var maxPrio = levels[maxLevel];
      var logs = prio <= maxPrio;
// console.log("logs=" + logs + ", maxLevel=" + maxLevel + ", maxPrio=" + maxPrio);
      if (type !== 'enter' && !logs)
        return false;

      var record = {
      };
      record.type = type;
      record.level = level;
      if (typeof(args[0]) !== 'string' && typeof(args[1]) === 'string')
        record.error = args.shift();
      for (var i = 1, ic = args.length; i < ic; i++) {
        var arg = args[i];
        // console.log(" i=" + i + ", arg=" + arg + ", classof=" + classof(arg));
        switch (classof(arg)) {
          case 'object':
          case 'array':
            args[i] = log.dump(args[i], {depth:2, maxlen:1e3});
            break;
        }
      }
      try {
        record.message = args.length == 1 ? args[0] : sprintf.apply(null, args)
      } catch (error) {
        throw error;
      }
      record.loc = loc;
      record.prio = prio;
      record.host = host;
      record.date = new Date();
      record.depth = stack.length;
      record.mdc = mdc;

      // console.log(record);

      if (logs) {
        for (var i = 0, ic = stack.length; i < ic; i++) {
          var prev = stack[i];
          if (!prev.appended) {
            this.append(prev);
          }
        }
        this.append(record);
      }
      if (type === 'enter')
        stack.push(record);
      return true;
    },

    append: function(record) {
      // console.log("append record", record);
      /* If we haven't figured out our transports, then initialize our
       * transports the first time */
      if (!this.transports)
        this._initTransports()
      // console.log("transports", this.transports);

      /* Append each transport */
      for (var t = 0, tc = this.transports.length; t < tc; t++) {
        var transport = this.transports[t];
        transport.append(record);
      }

      record.appended = true;
    },

    /** Registers a plugin with the log. There are two logins at the moment.
     *
     *  @param  plugin The plugin ({function}, required)
     *  @since  1.0
     */
    use: function(plugin) {
      if (typeof(plugin) === 'function' && plugin.prototype instanceof Transport) {
        var id = plugin.id || plugin.name.replace(/Transport$/, '').toLowerCase();
        // console.log("log: registering transport " + id, plugin);
        this._registeredTransports[id] = plugin;
      } else if (typeof(plugin) === 'function' && plugin.prototype instanceof Format) {
        var id = plugin.id || plugin.name.replace(/Format$/, '').toLowerCase();
        // console.log("log: registering format " + id, plugin);
        this._registeredFormats[id] = plugin;
      } else {
        throw new Error("Unsupported plugin: " + plugin);
      }
    },
    _registeredTransports: {},
    _registeredFormats: {},

    /** Initialize the transports configured for this
     *
     *  @since  1.0
     */
    _initTransports: function() {
      this.transports && this.transports.forEach(function(t) { t.detach(log) });
      this.transports = [];
      for (var id in this.transportConfigs) {
        var config = this.transportConfigs[id];
        var Transport = this._registeredTransports[id];
        if (!Transport) {
          console.log("log: no such transport: " + id + ", registered: " + (Object.keys(this._registeredTransports).join(', ') || '<none>'));
          continue;
        }
        var transport = new Transport(config);
        if (!transport.format) {
          var formatId = config.format || transport.defaultFormat;
          var Format = this._registeredFormats[formatId];
          if (!Format) {
            console.log("log: no such format: " + formatId);
            continue;
          }
          var format = new Format();
          transport.format = format;
        }
        transport.attach();
        this.transports.push(transport);
      }
    },

//    formats: {},
//    addFormat(name, func) {
//      this.formats[name] = func;
//    },
//
//    sinks: {},
//    addSink(name, func) {
//      this.sinks[name] = func;
//    },

    dump: dump,
    sprintf: sprintf,
    strftime: strftime,

    colorize: colorize,
    ansiize: colorize.ansiize,
    htmlize: colorize.htmlize,

    trace: function() {
      tracer || (tracer = require('./tracer.js'));
      return tracer.trace.apply(tracer, arguments);
    },
    untrace: function() {
      tracer || (tracer = require('./tracer.js'));
      return tracer.untrace.apply(tracer, arguments);
    },

  };
  for (var key in props)
    log[key] = props[key];

  var maxLevelCache = {};
  var stack = [];
  var mdc = null;

  var levels = Object.freeze({
    fatal:  1,
    error:  2,
    warn:   3,
    config: 4,
    info:   10,
    debug:  11,
    fine1:  15,
    fine2:  16,
    fine3:  17,
  });

  for (var level in levels) {
    log[level] = function(format) {
      var args = slice.call(arguments);
      args.unshift(level);
      return this.recordv(1, 'log', args);
    }
  }

  log.configure({
    levels: env.LOGLEVEL || {'*:*':'warn'},
    transports: env.LOGTRANSPORT || 'console?format=compact',
  })

//  addSink: function(sink) {
//
//  },

  // LOGLEVEL
  // LOGTRANSPORT='console'
  // LOGFORMAT='compact'


  function Transport(config) {
    this.config = config || {};
    this.name = this.config.name;
    this.url = this.config.url;
    this.params = this.config.params;
  }
  Transport.prototype.attach = function(log) {
  };
  Transport.prototype.detach = function(log) {
  };
  Transport.prototype.append = function(record) {
    // console.log("Transport.append(): record=" + record);
    var data = this.format.format(record);
    // console.log("Transport.append(): data=" + data);
    this.write(data);
  };
  Transport.prototype.write = function(data) {
  };
  log.Transport = Transport;

  function ConsoleTransport() {
    Transport.call(this, 'console', 'compact');
    this.browser = typeof(window) !== 'undefined';
  }
  ConsoleTransport.prototype = Object.create(log.Transport.prototype);
  ConsoleTransport.prototype.write = function(data) {
    if (this.browser) {
      var parts = colorize.browserize(data);
      // console.log("parts", parts);
      console.log.apply(null, parts);
    } else {
      console.log(colorize.ansiize(data));
    }
  };
  log.use(ConsoleTransport);

  function Format(name) {
    this.name = name || this.constructor.name.replace(/Format$/, '').toLowerCase();
  }
  Format.prototype.format = function(record) {
    return record;
  };
  log.Format = Format;

  /**
   *
   */
  function LineFormat() {
    Format.call(this, 'compact');
    this.levels = { fatal:'F', error:'E', warn:'W', config:'C', info:'I', debug:'D', fine1:'1', fine2:'2', fine3:'3' };
    this.colors = ['bbl', 'bcy', 'yl', 'bmg', 'brd', 'cy', 'bl', 'mg'];
    this.nextColorIndex = 0;
    this.pkgColors = {};
  }
  LineFormat.prototype = Object.create(log.Format.prototype);
  LineFormat.prototype.format = function(record) {
    var time = strftime(this.dateFormat || "%S.%L", record.date)
    var loc = record.loc, path = loc.path;
    var marker = record.type === 'enter' ? '#bbk[\\]' : record.type === 'leave' ? '#bbk[/]' : '#bbk[:]';

    var file = loc.file != 'index.js' ? loc.file : loc.subpath.replace(/.*\x2f(.*)\x2f/, '$1/index.js');

    var pkgColor = this.pkgColors[loc.pkg] || (this.pkgColors[loc.pkg] = this.colors[this.nextColorIndex++ % this.colors.length]);
    var frameText = sprintf("#%s[%s] #%s[%s]#wh[:%s]", pkgColor, loc.pkg, loc.kind == 'test' ? 'bcy' : 'bwh', file, loc.line);
    var text = sprintf("#bbk[%-6s] #bk[%1.1s] %-" + this.headerWidth + "s%" + record.depth + "s%s %s", time, this.levels[record.level], frameText, '', marker, record.message);
    // console.log(text);
    var x = text
      .replace(/^#bbk\x5b.*#bbk\x5b:\x5d \^\^/, '  ')
      .replace(/^(#bbk\x5b.{6}\x5d).*?#bbk\x5b:\x5d \^/, '$1 ')
      .replace(/\n/g, '\n  ');
    // console.log(x);
    return x;
  }

  /** 
   *
   *
   */
  function CompactFormat() {
    LineFormat.call(this, arguments);
    this.dateFormat = '%S.%L';
    this.headerWidth = 55;
  }
  CompactFormat.prototype = Object.create(LineFormat.prototype);
  log.use(CompactFormat);

  function FullFormat() {
    LineFormat.call(this, arguments);
    this.dateFormat = '%Y-%m-%d %H:%M:%S.%L';
    this.headerWidth = 65;
  }
  FullFormat.prototype = Object.create(LineFormat.prototype);
  log.use(FullFormat);


  function classof(value) {
    return toString.call(value).match(/^\[object (.*)\]$/)[1].toLowerCase();
  }
  var toString = Object.prototype.toString;

  /*
   * Export to CommonJS and global.
   */
  if (typeof(module) === 'object') {
    module.exports = log;
  } else {
    var prevlog = root.log;
    root.log = log;
    log.noConflict = function() { root.log = prevlog; return log; };
  }
  return log;

  module.exports = log;

})(this);
