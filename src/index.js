#!/usr/bin/env node

import express from 'express'
import http from 'http'
import Service from 'umi-build-dev/lib/Service'
import PluginAPI from 'umi-build-dev/lib/PluginAPI'

import mockMiddleware from './createMockMiddleware'

// process.env.UMI_DIR = pwd + "/node_modules/umi";

// 初始化service
const service = new Service({
    cwd: process.cwd()
})

const api = new PluginAPI('mock-data', service);

const app = express();

// respond with mockMiddleware
app.use(mockMiddleware(api, []));

//create node.js http server and listen on port
const server = http.createServer(app).listen(3000, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log('umi mock serve at http://%s:%s', host, port);
});
