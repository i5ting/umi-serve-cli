#!/usr/bin/env node
"use strict";

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _Service = _interopRequireDefault(require("umi-build-dev/lib/Service"));

var _PluginAPI = _interopRequireDefault(require("umi-build-dev/lib/PluginAPI"));

var _createMockMiddleware = _interopRequireDefault(require("./createMockMiddleware"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// process.env.UMI_DIR = pwd + "/node_modules/umi";
// 初始化service
const service = new _Service.default({
  cwd: process.cwd()
});
const api = new _PluginAPI.default('mock-data', service);
const app = (0, _express.default)(); // respond to all requests

app.use((0, _createMockMiddleware.default)(api, [])); //create node.js http server and listen on port

const server = _http.default.createServer(app).listen(3000, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('umi mock serve at http://%s:%s', host, port);
});