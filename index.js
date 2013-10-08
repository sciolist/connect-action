'use strict';

module.exports = exports = function create(app, fn) {
  if(app instanceof Function) {
    fn = app;
    app = null;
  }

  if(app && app.actions) {
    throw new Error('actions already registered');
  }

  var actions = new Actions();
  if(app) {
    app.actions = actions;
    app.use(actions);
  }
  if(fn) actions.urlResolver(fn);
  return actions;
};

function Actions() {
  this.resolvers = [];
  this.stack = {};
}

// Connect route-handler, append helper methods
Actions.prototype.handle = function handle(req, res, next) {
  var self = this;
  req.actions = this;

  // req.resolve.action('name', function (url) {});
  if(!req.resolve) { req.resolve = {} }
  req.resolve.action = function action(name, query) {
    var result, opts = { name: name, query: query, req: req };
    for(var i=0; i<self.resolvers.length; ++i) {
      result = self.resolvers[i](opts);
      if(result) return result;
    }
  }

  // If redirect middleware exists, add redirect to action function.
  if(res.redirect) {
    res.redirect.action = function action(name, query) {
      req.resolve.action(name, query, function (url) {
        res.redirect(url);
      });
    }
  }

  next();
};

// Add url-resolving function
Actions.prototype.urlResolver = function urlResolver(fn) {
  this.resolvers.push(fn);
};

// Remap common http-methods
(['all', 'get', 'post', 'delete', 'put']).forEach(function (method) {
  Actions.prototype[method] = function map(name, fn) { 
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 0, method.toUpperCase());
    this.map.apply(this, args);
  }
});

// Append action to stack
Actions.prototype.map = function map(method, name, fn) {
  var route = { stack: [] };
  route.__proto__ = require('connect').proto;
  route.use.apply(route, Array.prototype.slice.call(arguments, 2));
  this.stack[method + '/' + name] = route.handle.bind(route);
};

// Resolve action handler from action name
Actions.prototype.handler = function handler(method, name) {
  if(arguments.length === 1) {
    name = method;
    method = 'GET';
  }

  var found = this.stack[method + '/' + name];
  if(!found) found = this.stack['all/' + name];
  return found;
};

// Pass request to action handler
Actions.prototype.run = function run(name, method, req, res, next) {
  if(arguments.length === 4) {
    req = arguments[1];
    res = arguments[2];
    next = arguments[3];
    method = req.method || 'GET';
  }
  else if(arguments.length === 3) {
    req = arguments[0];
    res = arguments[1];
    next = arguments[2];
    method = req.method || 'GET';
    name = (req.params && req.params.action) || null;
  }

  var method = req.method;
  var action = this.handler(method, name);
  if(!action) { next(); return; }
  action(req, res, next);
};

