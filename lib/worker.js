'use strict';

const {parentPort} = require('node:worker_threads');
const tryToCatch = require('try-to-catch');

parentPort.on('message', async ({name, args}) => {
    const fn = require(name);
    const [e, result] = await tryToCatch(fn, ...args);
    const error = !e ? null : {
        ...e,
        message: e.message,
    };
    
    parentPort.postMessage([error, result]);
});
