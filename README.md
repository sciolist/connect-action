named-actions
=============

Map up names to connect style handlers.

Install
-------

    $ npm install named-actions

Usage
-----

```js
var app = require('express')();
app.actions = require('named-actions')();

app.actions.get('root', function (req, res) {
  res.end('<a href="/login">Log in</a>');
});

app.actions.get('login', function (req, res) {
  res.end('Login page');
});

app.all('/:action', function (req, res, next) {
  var handler = app.actions.handler(req.params.action || 'root', req.method);
  handler(req, res, next);

  // alternatively:
  // app.actions.run(req.params.action || 'root', req.method, req, res, next);
});
app.listen(3000);
```

