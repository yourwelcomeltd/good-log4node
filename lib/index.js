'use strict';

var Stream = require('stream');
var GoodSqueeze = require('good-squeeze')
var Hoek = require('hoek');
var SafeStringify = require('json-stringify-safe');
	
class Log4NodeStream extends Stream.Writable {
	constructor(log4Node, logLevels) {
		super({objectMode: true});
		this.logger = log4Node;
		this.logLevels = logLevels;
	}
	
	_formatResponse(event) {
		var query = event.query ? JSON.stringify(event.query) : '';
		var responsePayload = '';
		if (event.responsePayload && typeof event.responsePayload === 'object') {
			responsePayload = 'response payload: ' + SafeStringify(event.responsePayload);
		}
		return Hoek.format('%s: %s %s %s %s (%sms) %s', event.instance, event.method, event.path, query, event.statusCode, event.responseTime, responsePayload);
	};
	
	_write(chunk, enc, next) {
    	
		// Get the event type
		var event = chunk;
		var eventType = event.event;
		var output;
		var logLevel;
		switch(eventType)
		{
			case 'response':
				logLevel = this.logLevels.responseLevel;
				output = this._formatResponse(event);
				break;
		
			case 'ops':
				logLevel = this.logLevels.opsLevel;
				output = Hoek.format('memory: %sMb, uptime (seconds): %s, load: %s', Math.round(event.proc.mem.rss / (1024 * 1024)), event.proc.uptime, event.os.load);
				break;
				
			case 'error':
				logLevel = this.logLevels.errorLevel;
				output = 'message: ' + event.error.message + ' stack: ' + event.error.stack;
				break;
			
			case 'request':
				logLevel = this.logLevels.requestLevel;
				output = 'data: ' + (typeof event.data === 'object' ? SafeStringify(event.data) : event.data);
				break;
				
			case 'log':
				logLevel = this.logLevels.logLevel;
				output = 'data: ' + (typeof event.data === 'object' ? SafeStringify(event.data) : event.data);
				break;
			
			default:
				// Handle exceptions
				if(event instanceof Error)
				{
					output = event;
					logLevel = this.logLevels.errorLevel;
				}
				else
				{
					if (event.data) {
						output = 'data: ' + (typeof event.data === 'object' ? SafeStringify(event.data) : event.data);
					} else {
						output = 'event: ' + eventType + ' data: (none)';
					}
					logLevel = this.logLevels.otherLevel;
				}
				break;
		}
		
		// Get the log type
		if(output)
		{
			if(!logLevel)
			{
				logLevel = this.logLevels.otherLevel;
			}

			this.logger[logLevel](output);
		}
		
		next();
	}
}

class GoodLog4Node {
	constructor(events, config) {
		var defaults = {
			logLevels: {
				errorLevel: 'error',
				opsLevel: 'notice',
				requestLevel: 'notice',
				responseLevel: 'notice',
				logLevel: 'notice',
				otherLevel: 'info'
			}
		};
		
		if (config == null) {
		  config = {};
		}
		var settings = Hoek.applyToDefaults(defaults, config);
		
		var log = config.log || require('log4node');
		this.logger = log;
		this.logLevels = settings.logLevels;
		
		this.squeeze = GoodSqueeze.Squeeze(events);
	}
	
	init(readstream, emitter, callback) {
		
		var loggerStream = new Log4NodeStream(this.logger, this.logLevels);
		
		readstream
		.pipe(this.squeeze) // filters events as configured above
		.pipe(loggerStream);

		emitter.on('stop', function () {
			
		});

		callback();
	}
};

module.exports = GoodLog4Node;