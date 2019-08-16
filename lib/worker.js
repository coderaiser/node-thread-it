'use strict';

const {
    parentPort,
} = require('worker_threads');

const tryCatch = require('try-catch');

parentPort.on('message', ({message, data}) => {
    if (message === 'require') {
        for (const name of data.names)
            require(name);
        
        return;
    }
    
    if (message === 'run') {
        const {name, args} = data;
        const fn = require(name);
        const [e, result] = tryCatch(fn, ...args);
        
        parentPort.postMessage([e, result]);
        return;
    }
});

