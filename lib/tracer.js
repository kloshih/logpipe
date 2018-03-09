/*
 * tracer.js
 */

const log = require('./log.js');
const kv = require('keyvalues');

function tracer() {
}

//tracer.trace = traceMethods;
//tracer.untrace = untraceMethods;

tracer.trace = trace;
tracer.untrace = untrace;

module.exports = tracer;

const ignoredClassKeys = "length,name,prototype,toString".split(','),
      ignoredProtoKeys = "constructor,toString".split(','),
      builtInTypes = [Object, String, Array, Date];

/*
 * Trace
 *
 */

function trace(type, opts) {
  opts || (opts = {}), opts.forType || (opts.forType = type);
  // console.log("Tracing type: " + type.name);
  traceMethods('class', type, type, opts);
  traceMethods('proto', type, type.prototype, opts);
  /* Propagate our trace */
  var supertype = getSupertypeOf(type);
  // console.log("  supertype: " + (supertype && supertype.name));
  if (supertype && builtInTypes.indexOf(supertype) < 0)
    trace(supertype, opts);
}

function traceMethods(kind, type, target, opts) {
  var ignoredKeys = kind == 'class' ? ignoredClassKeys : ignoredProtoKeys;
  var keys = Object.getOwnPropertyNames(target);
  for (var k, kc = keys.length; k < kc; k++) {
    var key = keys[k];
    if (~ignoredKeys.indexOf(key))
      continue;
    var desc = Object.getOwnPropertyDescriptor(target, key),
        impl = desc.value;
    if (kv.typeof(impl) !== 'function' || !desc.configurable)
      continue;
    var wrap = wrapMethod(kind, type, key, impl, opts.forType);
    Object.defineProperty(target, key, {value:wrap, configurable:true});
    wrap.unwrap = function() {
      Object.defineProperty(target, key, {value:impl, configurable:true});
    };
  }
}

function untrace(type, opts) {
  opts || (opts = {}), opts.forType || (opts.forType = type);
  untraceMethods('class', type, type, opts);
  untraceMethods('proto', type, type.prototype, opts);
  /* Propagate our trace */
  var supertype = getSupertypeOf(type);
  if (supertype && supertype !== Object)
    untrace(supertype, opts);
}

function untraceMethods(kind, type, target, opts) {
  var  keys = Object.getOwnPropertyNames(target);
  for (var k, kc = keys.length; k < kc; k++) {
    var key = keys[k];
    if (~ignoredClassKeys.indexOf(key))
      continue;
    var desc = Object.getOwnPropertyDescriptor(target, key),
        impl = desc.value;
    if (kv.typeof(impl) !== 'function')
      continue;
    if (impl.wrap === 'trace') {
      var forTypes = impl.forTypes;
      var index = forTypes.indexOf(opts.forType);
      // console.log("here=" + key + ", index=" + index);
      if (index >= 0) {
        forTypes.splice(index, 1);
        if (forTypes.length === 0) {
          if (!impl.next)
            throw new Error("IMPL");
          Object.defineProperty(target, key, {value:impl.next});
        }
      }
    }
  }
}


function wrapMethod(kind, type, key, impl, forType) {
  /* If we've already wrapped, then simply add ourselves to the wrap method. To
   * support other instrumenters, like require('reloader') or perhaps generalize
   * trace to an intercepter to support chained intercepters, we'll support an
   * setting like {wrap() wrap:<type>, next:<func>, forTypes:[..],
   * unwrap:<unwrap()>} */
  if (impl.wrap === 'trace') {
    if (impl.forTypes.indexOf(forType) < 0)
      impl.forTypes.push(forType);
    return impl;
  }
  var isClass = kind === 'class';
  var argNames = extractArgNames(impl);
  var wrap = function() {
    var cnst = isClass ? this : this.constructor;
    var obj = isClass ? this.name : this;
    if (wrap.forTypes.indexOf(cnst) < 0)
      return wrap.next.apply(this, arguments);
    var argText = extractArgText(argNames, arguments);
    var time = hrtime();
    try {
      log.enter(['info',1], "#wh[%s.%s]#bbk[(%s)] #bbk[> %s]", type.name, key, argText, obj);
      var result = wrap.next.apply(this, arguments)
      time = hrtime(time);
      // log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, objText, log.dump(result, {maxlen:1e3, depth:1}));
      if (isThenable(result)) {
        var promiseId = nextPromiseId++;
        log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #bcy[< promise(%s)]", type.name, key, argText, obj, promiseId);
        result.then(function(res) {
          log('info', "^%41s #bcy[promise(%d)] #bbk[resolve] #wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", '', promiseId, type.name, key, argText, obj, log.dump(res, {maxlen:1e3, depth:1}));
        }).catch(function(err) {
          log('info', "^%41s #bcy[promise(%d)] #brd[error] #wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", '', promiseId, type.name, key, argText, obj, err, loc.pkg, loc.file, loc.line);
        });
      } else {
        log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, obj, log.dump(result, {maxlen:1e3, depth:1}));
      }
      return result;
    } catch (err) {
      time = hrtime(time);
      var loc = log.loc(1, err);
      log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", type.name, key, argText, obj, err, loc.pkg, loc.file, loc.line);
      throw err;
    }
  }
  wrap.wrap = 'trace';
  wrap.next = impl;
  wrap.forTypes = [forType];
  return wrap;
}

/* Extract argument names from a function */
function extractArgNames(func) {
  for (; func && func.next; func = func.next);
  var match = func.toString().match(/(\w+)\s*\(([^\x29]+)\)/),
      argNames = match && match[2].trim().split(/\s*,\s*/);
  return argNames;
}
/* Format arguments with optional names */
function extractArgText(names, args) {
  var argText = [];
  for (var i = 0, ic = args.length; i < ic; i++) {
    if (i > 0) argText.push(',');
    var arg = args[i], name = names && names[i];
    if (name) argText.push(name, '=');
    argText.push(log.dump(arg, {maxlen:1024, depth:1, ellipses:50 }))
  }
  return argText.join('');
}
function isThenable(value) {
  return value && typeof(value.then) === 'function';
}

function getSupertypeOf(type) {
  var superproto = type && type.prototype && Object.getPrototypeOf(type.prototype);
  return superproto && superproto.constructor;
}


//function traceMethods(type, opts) {
//  if (typeof(type) !== 'function')
//    throw new Error("Can only trace functions/classes");
//  opts || (opts = {}), opts.type || (opts.type = type);
//  let proto = type.prototype;
//  // console.log("Tracing " + type.name + ", target=" + opts.type.name);
//  let keys = Object.getOwnPropertyNames(proto);
//  for (let key of keys) {
//    if (key === 'toString' || key === 'constructor')
//      continue;
//    let desc = Object.getOwnPropertyDescriptor(proto, key),
//        val = desc.value;
//    if (kv.typeof(val) !== 'function')
//      continue;
//    /* Check to see if this has already been wrapped. */
//    let method = val;
//    if (method.wrap === 'trace') {
//      if (method.types.indexOf(opts.type) < 0)
//        method.types.push(opts.type);
//      //console.log(">>> reusing trace adding our type: " + opts.type.name + " => " + method.types.map((t) => t.name).join(', '));
//      continue;
//    }
//    var match = method.toString().match(/(\w+)\s*\(([^\x29]+)\)/),
//        argNames = match && match[2].trim().split(/\s*,\s*/);
//    // if (!argNames) console.log("argNames: " + proto.constructor.name + "." + method.toString());
//    let wrap = function() {
//      var cnst = this.constructor;
//      //console.log(">>> call " + type.name + "." + key + "(), cnst=" + cnst.name + ", types=" + wrap.types.map(function(t) { return t.name }).join(', '));
//      if (wrap.types.indexOf(cnst) < 0) {
//        // console.log(">>> direct");
//        return wrap.method.apply(this, arguments);
//      }
//
//      var objText = this.toString();
//      if (objText === '[object Object]')
//        objText = cnst.name + '()';
//      var argText = [];
//      for (var i = 0, ic = arguments.length; i < ic; i++) {
//        if (i > 0) argText.push(',');
//        let arg = arguments[i], name = argNames && argNames[i];
//        if (name) argText.push(name, '=');
//        argText.push(log.dump(arg, {maxlen:1024, depth:1}))
//      }
//      argText = argText.join('');
//      let time = hrtime();
//      try {
//        log.enter(['info',1], "#wh[%s.%s]#bbk[(%s)] #bbk[> %s]", type.name, key, argText, objText);
//        var result = wrap.method.apply(this, arguments)
//        time = hrtime(time);
//        // log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, objText, log.dump(result, {maxlen:1e3, depth:1}));
//if (result && typeof(result.then) === 'function') {
//  var promiseId = nextPromiseId++;
//  log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #bcy[< promise(%s)]", type.name, key, argText, objText, promiseId);
//  result.then(function(res) {
//    log('info', "^%41s #bcy[promise(%d)] resolve #wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", '', promiseId, type.name, key, argText, objText, log.dump(res, {maxlen:1e3, depth:1}));
//  }).catch(function(err) {
//    log('info', "^%41s #bcy[promise(%d)] error #wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", '', promiseId, type.name, key, argText, objText, err, loc.pkg, loc.file, loc.line);
//  });
//} else {
//  log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, objText, log.dump(result, {maxlen:1e3, depth:1}));
//}
//        return result;
//      } catch (err) {
//        time = hrtime(time);
//        let loc = log.loc(1, err);
//        log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", type.name, key, argText, objText, err, loc.pkg, loc.file, loc.line);
//        throw err;
//      }
//    };
//    wrap.wrap = 'trace';
//    wrap.method = method;
//    wrap.types = [opts.type];
//    Object.defineProperty(proto, key, {value:wrap});
//  }
//  if (!('supermethods' in opts) || opts.supermethods) {
//    // (opts.types || (opts.types = [])).push(type);
//    var superproto = Object.getPrototypeOf(proto);
//    if (superproto && superproto.constructor !== Object) {
//      traceMethods(superproto.constructor, opts);
//    }
//  }
//}
//
//function untraceMethods(type, opts) {
//  opts || (opts = {}), opts.type || (opts.type = type);
//  let proto = type.prototype;
//  let keys = Object.getOwnPropertyNames(proto);
//  for (let key of keys) {
//    let desc = Object.getOwnPropertyDescriptor(proto, key),
//        val = desc.value;
//    if (kv.typeof(val) !== 'function')
//      continue;
//    /* Check to see if this has already been wrapped. */
//    let method = val;
//    if (method.wrap === 'trace') {
//      // console.log(">>> checking tracer to " + type.name + "." + key + "()");
//      let index = method.types.indexOf(opts.type);
//      // console.log(">>> method.types=" + method.types);
//      if (index >= 0) {
//        method.types.splice(index, 1);
//        if (method.types.length == 0) {
//          // console.log(">>> uninstalling tracer to " + type.name + "." + method.method);
//          Object.defineProperty(proto, key, {value:method.method});
//        }
//      }
//      continue;
//    }
//  }
//  // console.log("Untracing");
//  var superproto = Object.getPrototypeOf(proto);
//  if (superproto && superproto.constructor !== Object)
//    untraceMethods(superproto.constructor, opts);
//}

var nextPromiseId = 0;

/** Wraps a method
 *
 *
 */
var hrtime;
if (process.hrtime) {
  hrtime = function(time) {
    if (!time) {
      return process.hrtime();
    } else {
      // console.log("tracer process.hrtime() time=", time);
      time = process.hrtime(time);
      return time[0] * 1e3 + time[1] / 1e6;
    }
  };
} else {
  hrtime = function(time) {
    if (!time) {
      return Date.now();
    } else {
      return Date.now() - time;
    }
  };
}
