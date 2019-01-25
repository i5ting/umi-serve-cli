"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _express = _interopRequireDefault(require("express"));

var _Service = _interopRequireDefault(require("umi-build-dev/lib/Service"));

var _PluginAPI = _interopRequireDefault(require("umi-build-dev/lib/PluginAPI"));

var _createMockMiddleware = _interopRequireDefault(require("./createMockMiddleware"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// process.env.UMI_DIR = pwd + "/node_modules/umi";
var _default = options => {
  // 初始化service
  const service = new _Service.default({
    cwd: process.cwd()
  });
  const api = new _PluginAPI.default('mock-data', service);
  const app = (0, _express.default)(); // respond with mockMiddleware

  app.use((0, _createMockMiddleware.default)(api, []));
  return app;
};

exports.default = _default;