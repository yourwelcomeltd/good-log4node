# good-log4node

The code here is basically taken from [good-Log4Node][3], replacing references to Log4Node with log4node.

A [hapi][0] [good-reporter][1] to [log4node][2] logging adapter.

## Installation

``` bash
  $ npm install log4node
  $ npm install good-log4node
```

## Usage

To use the `GoodLog4Node` transport in log4node, you simply need to require it and
then either add it to an existing Log4Node logger or pass an instance to a new
Log4Node logger:

``` js
var GoodLog4Node = require('good-log4node');
var Log4Node = require('log4node');

server.register({
  register: require('good'),
  options: {
    reporters: [
      new GoodLog4Node({
        ops: '*',
        request: '*',
        response: '*',
        log: '*',
        error: '*'
      }, Log4Node)
    ]
  }
}, function(err) {
  if (err) {
    return server.log(['error'], 'good load error: ' + err);
  }
});
```

The following `options` are availble to configure `GoodLog4Node`:

* __error_level:__ Map all good `error` events to this Log4Node level (Default `error`).
* __ops_level:__ Map all good `ops` events to this Log4Node level (Default `info`).
* __request_level:__ Map all good `request` events to this Log4Node level (Default `info`).
* __response_level:__ Map all good `response` events to this Log4Node level (Default `info`).
* __other_level:__ Map all other good events to this Log4Node level (Default `info`).

[0]: http://hapijs.com
[1]: https://github.com/hapijs/good-reporter
[2]: https://github.com/Log4Nodejs/Log4Node
[3]: https://github.com/lancespeelmon/good-Log4Node