var GoodReporter, GoodLog4Node, Hoek, SafeStringify, exports, internals;

GoodReporter = require('good-reporter');

Hoek = require('hoek');

SafeStringify = require('json-stringify-safe');

internals = {
  defaults: {
    error_level: 'error',
    ops_level: 'info',
    request_level: 'info',
    response_level: 'info',
    other_level: 'info'
  }
};

GoodLog4Node = (function() {
  function GoodLog4Node(events, log4Node, options) {
    var settings;
    if (options == null) {
      options = {};
    }
    Hoek.assert(this.constructor === GoodLog4Node, 'GoodLog4Node must be created with new');
    Hoek.assert(log4Node, 'log4Node logger must not be null');
    settings = Hoek.applyToDefaults(internals.defaults, options);
    this.log4Node = log4Node;
    this.error_level = settings.error_level;
    this.ops_level = settings.ops_level;
    this.request_level = settings.request_level;
    this.response_level = settings.response_level;
    this.other_level = settings.other_level;
    GoodReporter.call(this, events, settings);
  }

  return GoodLog4Node;

})();

Hoek.inherits(GoodLog4Node, GoodReporter);

GoodLog4Node.prototype._logResponse = function(event, tags) {
  var query, responsePayload;
  if (tags == null) {
    tags = [];
  }
  query = event.query ? JSON.stringify(event.query) : '';
  responsePayload = '';
  if (typeof event.responsePayload === 'object' && event.responsePayload) {
    responsePayload = 'response payload: ' + SafeStringify(event.responsePayload);
  }
  return this.log4Node[this.response_level](("[" + tags + "], ") + Hoek.format('%s: %s %s %s %s (%sms) %s', event.instance, event.method, event.path, query, event.statusCode, event.responseTime, responsePayload));
};

GoodLog4Node.prototype._report = function(event, data) {
  if (event === 'response') {
    return this._logResponse(data, data.tags);
  } else if (event === 'ops') {
    return this.log4Node[this.ops_level](Hoek.format('memory: %sMb, uptime (seconds): %s, load: %s', Math.round(data.proc.mem.rss / (1024 * 1024)), data.proc.uptime, data.os.load));
  } else if (event === 'error') {
    return this.log4Node[this.error_level]('message: ' + data.error.message + ' stack: ' + data.error.stack);
  } else if (event === 'request' || event === 'log') {
    return this.log4Node[this.request_level]('data: ' + (typeof data.data === 'object' ? SafeStringify(data.data) : data.data));
  } else if (data.data) {
    return this.log4Node[this.other_level]('data: ' + (typeof data.data === 'object' ? SafeStringify(data.data) : data.data));
  } else {
    return this.log4Node[this.other_level]('data: (none)');
  }
};

GoodLog4Node.prototype.stop = function() {};

GoodLog4Node.prototype.init = function(readstream, emitter, callback) {
  readstream.on('data', (function(_this) {
    return function(chunk) {
      return _this._handleEvent(chunk.event, chunk);
    };
  })(this));
  emitter.on('stop', (function(_this) {
    return function() {
      return _this.stop();
    };
  })(this));
  return callback(null);
};

module.exports = exports = GoodLog4Node;
