'use strict';

var Stream = require('stream');
var Hoek = require('hoek');
	
class Log4NodeStream extends Stream.Writable {
	constructor(options) {
		super({objectMode: true});
		
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
		
		if (options == null) {
		  options = {};
		}
		var settings = Hoek.applyToDefaults(defaults, options);
		
		this.logger = options.log || require('log4node');
		this.logLevels = settings.logLevels;
	}
	
	_formatResponse(event) {
		var query = event.query ? JSON.stringify(event.query) : '';
		var responsePayload = '';
		if (event.responsePayload && typeof event.responsePayload === 'object') {
			responsePayload = 'response payload: ' + JSON.stringify(event.responsePayload);
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
				output = 'data: ' + event.data;
				break;
				
			case 'log':
				logLevel = this.logLevels.logLevel;
				output = 'data: ' + event.data;
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
						output = 'data: ' + event.data;
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

module.exports = Log4NodeStream;