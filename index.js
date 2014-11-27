var url = require('url');
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var mixin = require('merge-descriptors');
var Timer = require('./lib/timer');

exports.create = function createHttp() {
  var MeasureHttp = Object.create(http);
  mixin(MeasureHttp, EventEmitter.prototype);
  MeasureHttp.request = request;
  MeasureHttp.get = get;

  return MeasureHttp;

  function request (options, onResponse) {
    var uri = options;
    if(typeof uri === 'string') uri = url.parse(uri);
    var timer = new Timer();
    timer.start('totalTime');
    var req = http.request(options, onResponse);
    setImmediate(timer.start.bind(timer, 'processingTime'));
    setImmediate(timer.start.bind(timer, 'connectionTime'));
    req.on('socket', timer.stop.bind(timer, 'connectionTime'));
    req.on('response', function(response) {
      timer.stop('processingTime');
      timer.start('transmittingTime');
      response.on('end', function() {
        timer.stop('transmittingTime');
        MeasureHttp.emit('stat', uri, timer.toJSON());
      });
    });
    return req;
  }

  function get (options, onResponse) {
    var req = request(options, onResponse);
    req.end();
    return req;
  }

};
