#!/usr/bin/env node
"use strict";

var _http = _interopRequireDefault(require("http"));

var _app = _interopRequireDefault(require("./app"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//create node.js http server and listen on port
const server = _http.default.createServer((0, _app.default)()).listen(3000, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('umi mock serve at http://%s:%s', host, port);
});