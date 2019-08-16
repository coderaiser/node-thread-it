'use strict';

const {parentPort} = require('worker_threads');
const tryCatch = require('try-catch');

parentPort.on('message', ({name, args}) => {
    const fn = require(name);
    const [e, result] = tryCatch(fn, ...args);
    const error = !e ? null : {
        ...e,
        message: e.message,
    };
    
    parentPort.postMessage([error, result]);
});

