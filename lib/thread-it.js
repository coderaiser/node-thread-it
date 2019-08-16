'use strict';

const {promisify} = require('util');
const {cpus} = require('os');
const {join} = require('path');

const tryCatch = require('try-catch');
const holdUp = require('@iocmd/hold-up');

const workerPath = join(__dirname, 'worker.js');

const isWorkersError = () => {
    const [e] = tryCatch(require, 'worker_threads');
    return e;
};

const onMessage = (callback) => ([error, result]) => {
    callback(error, result);
};

const process = promisify((name, args, worker, callback) => {
    worker.once('message', onMessage(callback));
    worker.postMessage({
        name,
        args,
    });
});

let workers = [];

module.exports = (name, options) => {
    if (isWorkersError()) {
        const fn = require(name);
        
        return async (...a) => fn(...a);
    }
    
    if (!workers.length)
        throw Error('You should init workers first!');
    
    return async (...args) => {
        const worker = await holdUp([getFreeWorker, workers], options);
        const result = await process(name, args, worker);
        
        return result;
    };
};

module.exports.init = () => {
    if (isWorkersError())
        return;
    
    if (workers.length)
        throw Error('Terminate existing workers first!');
    
    workers = initWorkers();
};

module.exports.terminate = () => {
    terminateWorkers(workers);
    workers = [];
};

function initWorkers() {
    const {Worker} = require('worker_threads');
    let i = cpus().length;
    
    const workers = [];
    const free = true;
    
    while (i--) {
        const worker = new Worker(workerPath);
        
        workers.push({
            worker,
            free,
        });
    }
    
    return workers;
}

function terminateWorkers(workers) {
    for (const {worker} of workers) {
        worker.terminate();
    }
}

const isFree = ({free}) => free;
function getFreeWorker(workers) {
    const {worker} = workers.find(isFree);
    return worker;
}

