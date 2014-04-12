'use strict';
var methods = require('methods');
var connect = require('connect');

module.exports = Actions;

function Actions() {
  if(!(this instanceof Actions)) return new Actions();
  this.stack = {};
}

// Remap common http-methods
methods.concat(['all']).forEach(function (method) {
  Actions.prototype[method] = function map(name, fn) { 
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 0, method);
    this.map.apply(this, args);
  }
});

// Append action to stack
Actions.prototype.map = function map(method, name, fn) {
  var route = { stack: [] };
  route.__proto__ = connect.proto;
  route.use.apply(route, Array.prototype.slice.call(arguments, 2));
  this.stack[method.toUpperCase() + '/' + name] = route.handle.bind(route);
};

// Resolve action handler from action name
Actions.prototype.handler = function handler(name, method) {
  var found = undefined;
  if(method) found = this.stack[method.toUpperCase() + '/' + name];
  if(!found) found = this.stack['ALL/' + name];
  return found;
};

// Pass request to action handler
Actions.prototype.run = function run(name, method, req, res, next) {
  if(arguments.length === 4) {
    req = arguments[1];
    res = arguments[2];
    next = arguments[3];
    method = req.method;
  }
  else if(arguments.length === 3) {
    req = arguments[0];
    res = arguments[1];
    next = arguments[2];
    method = req.method;
    name = (req.params && req.params.action) || null;
  }

  var action = this.handler(name, method);
  if(!action) { next(); return; }
  return action(req, res, next);
};

