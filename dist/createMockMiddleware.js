"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getMockMiddleware;

var _fs = require("fs");

var _path = require("path");

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _glob = _interopRequireDefault(require("glob"));

var _assert = _interopRequireDefault(require("assert"));

var _chokidar = _interopRequireDefault(require("chokidar"));

var _pathToRegexp = _interopRequireDefault(require("path-to-regexp"));

var _signale = _interopRequireDefault(require("signale"));

var _multer = _interopRequireDefault(require("multer"));

var _debug = _interopRequireDefault(require("debug"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

(0, _debug.default)("umi-serve");
const VALID_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const BODY_PARSED_METHODS = ['post', 'put', 'patch', 'delete'];

function getMockMiddleware(api, errors) {
  const {
    paths
  } = api.service;
  const {
    cwd,
    absPagesPath
  } = paths;
  const absMockPath = (0, _path.join)(cwd, process.env.MOCK_DIR ? process.env.MOCK_DIR : 'mock');
  const absConfigPath = (0, _path.join)(cwd, '.umirc.mock.js');
  api.addBabelRegister([absMockPath, absConfigPath, absPagesPath]);
  let mockData = getConfig();
  watch();

  function watch() {
    if (process.env.WATCH_FILES === 'none') return;

    const watcher = _chokidar.default.watch([absConfigPath, absMockPath, (0, _path.join)(absPagesPath, '**/_mock.js')], {
      ignoreInitial: true
    });

    watcher.on('all', (event, file) => {
      (0, _debug.default)(`[${event}] ${file}, reload mock data`);
      mockData = getConfig();

      if (!errors.length) {
        _signale.default.success(`Mock file parse success`);
      }
    });
  }

  function getConfig() {
    // Clear errors
    errors.splice(0, errors.length);
    cleanRequireCache();
    let ret = {};

    if ((0, _fs.existsSync)(absConfigPath)) {
      (0, _debug.default)(`load mock data from ${absConfigPath}`);
      ret = require(absConfigPath); // eslint-disable-line
    } else {
      console.log(`absMockPath=${absMockPath}`);

      const mockFiles = _glob.default.sync('**/*.js', {
        cwd: absMockPath
      }).map(p => (0, _path.join)(absMockPath, p)).concat(_glob.default.sync('**/_mock.js', {
        cwd: absPagesPath
      }).map(p => (0, _path.join)(absPagesPath, p)));

      (0, _debug.default)(`load mock data from ${absMockPath}, including files ${JSON.stringify(mockFiles)}`);

      try {
        ret = mockFiles.reduce((memo, mockFile) => {
          const m = require(mockFile); // eslint-disable-line


          memo = _objectSpread({}, memo, m.default || m);
          return memo;
        }, {});
      } catch (e) {
        errors.push(e);

        _signale.default.error(`Mock file parse failed`);

        console.error(e.message);
      }
    }

    return normalizeConfig(ret);
  }

  function parseKey(key) {
    let method = 'get';
    let path = key;

    if (key.indexOf(' ') > -1) {
      const splited = key.split(' ');
      method = splited[0].toLowerCase();
      path = splited[1]; // eslint-disable-line
    }

    (0, _assert.default)(VALID_METHODS.includes(method), `Invalid method ${method} for path ${path}, please check your mock files.`);
    return {
      method,
      path
    };
  }

  function createHandler(method, path, handler) {
    return function (req, res, next) {
      if (BODY_PARSED_METHODS.includes(method)) {
        _bodyParser.default.json({
          limit: '5mb',
          strict: false
        })(req, res, () => {
          _bodyParser.default.urlencoded({
            limit: '5mb',
            extended: true
          })(req, res, () => {
            sendData();
          });
        });
      } else {
        sendData();
      }

      function sendData() {
        if (typeof handler === 'function') {
          (0, _multer.default)().any()(req, res, () => {
            handler(req, res, next);
          });
        } else {
          res.json(handler);
        }
      }
    };
  }

  function normalizeConfig(config) {
    return Object.keys(config).reduce((memo, key) => {
      const handler = config[key];
      const type = typeof handler;
      (0, _assert.default)(type === 'function' || type === 'object', `mock value of ${key} should be function or object, but got ${type}`);
      const {
        method,
        path
      } = parseKey(key);
      const keys = [];
      const re = (0, _pathToRegexp.default)(path, keys);
      memo.push({
        method,
        path,
        re,
        keys,
        handler: createHandler(method, path, handler)
      });
      return memo;
    }, []);
  }

  function cleanRequireCache() {
    Object.keys(require.cache).forEach(file => {
      if (file === absConfigPath || file.indexOf(absMockPath) > -1 || (0, _path.basename)(file) === '_mock.js') {
        delete require.cache[file];
      }
    });
  }

  function matchMock(req) {
    const path = req.url;
    const exceptMethod = req.method.toLowerCase();

    for (const mock of mockData) {
      const {
        method,
        re,
        keys
      } = mock;

      if (method === exceptMethod) {
        const match = re.exec(req.path);

        if (match) {
          const params = {};

          for (let i = 1; i < match.length; i = i + 1) {
            const key = keys[i - 1];
            const prop = key.name;
            const val = decodeParam(match[i]);

            if (val !== undefined || !hasOwnProperty.call(params, prop)) {
              params[prop] = val;
            }
          }

          req.params = params;
          return mock;
        }
      }
    }

    function decodeParam(val) {
      if (typeof val !== 'string' || val.length === 0) {
        return val;
      }

      try {
        return decodeURIComponent(val);
      } catch (err) {
        if (err instanceof URIError) {
          err.message = `Failed to decode param ' ${val} '`;
          err.status = err.statusCode = 400;
        }

        throw err;
      }
    }

    return mockData.filter(({
      method,
      re
    }) => {
      return method === exceptMethod && re.test(req.url);
    })[0];
  }

  return function UMI_MOCK(req, res, next) {
    const match = matchMock(req);

    if (match) {
      console.log(`mock matched: [${req.method}] ${req.path}`);
      return match.handler(req, res, next);
    } else {
      console.error(`mock failed:  [${req.method}] ${req.url}`);
      return next();
    }
  };
}