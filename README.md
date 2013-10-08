connect-action
==============

A simple named action system for Connect

Install
-------

    $ npm install connect-action

Usage
-----

```js
var connect = require('connect');
var connectAction = require('connect-action');

var pages = {
  "/": { action: 'root' },
  "/login": { action: 'login', body: 'Login page' }
};

var actions = connectAction(function (action) {
  for (var url in pages) {
    if(pages[url].action === action.name) return url;
  }
});

actions.get('root', function (req, res) {
  var url = req.resolve.action('login');
  res.end('<a href="' + url + '">Log in</a>');
});

actions.get('login', function (req, res) {
  res.end(req.page.body);
});

var app = connect().use(actions);
app.use(function (req, res, next) {
  req.page = pages[req.url];
  if(!req.page) return next();
  actions.run(req.page.action, req, res, next);
});
app.listen(3000);
```

Helper functions
----------------

The connect-action module adds a couple of helper functions onto the
request and response objects

    // attempt to find a url for a given action:
    req.resolve.action('action-name');
    
    // if a redirect function exists, you can also redirect to actions:
    res.redirect.action('action-name');

