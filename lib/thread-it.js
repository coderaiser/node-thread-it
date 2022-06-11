'use strict';

const {cpus} = require('os');
const {join} = require('path');
const {once, EventEmitter} = require('events');

const tryCatch = require('try-catch');
const wait = require('@iocmd/wait');

const workerPath = join(__dirname, 'worker.js');
const {THREAD_IT_COUNT} = process.env;
const workersCount = isNaN(THREAD_IT_COUNT) ? cpus().length : Number(THREAD_IT_COUNT);

const {assign} = Object;

const workersDisabled = () => {
    if (!workersCount)
        return true;
    
    const [e] = tryCatch(require, 'worker_threads');
    return e;
};

const isFree = ({_threadItFree}) => _threadItFree;

const run = async ({name, args, workers}) => {
    let [worker] = workers.filter(isFree);
    
    if (!worker)
        [worker] = await once(workers._threadIt, 'ready');
    
    const postMessage = worker.postMessage.bind(worker);
    worker._threadItFree = false;
    
    const [[message]] = await Promise.all([
        once(worker, 'message'),
        wait(postMessage, {
            name,
            args,
        }),
    ]);
    
    worker._threadItFree = true;
    workers._threadIt.emit('free-worker', worker);
    
    const [error, result] = message;
    
    if (error)
        throw error;
    
    return result;
};

let workers = [];

module.exports = (name) => {
    if (workersDisabled()) {
        const fn = require(name);
        return async (...a) => await fn(...a);
    }
    
    return async (...args) => {
        if (!workers.length)
            throw Error('You should init workers first!');
        
        const result = await run({
            name,
            args,
            workers,
        });
        
        return result;
    };
};

module.exports.init = () => {
    if (workersDisabled())
        return;
    
    if (workers.length)
        return;
    
    workers = initWorkers();
};

module.exports.terminate = () => {
    terminateWorkers(workers);
    workers = [];
};

function initWorkers() {
    const {Worker} = require('worker_threads');
    let i = workersCount;
    const workers = [];
    const _threadItFree = true;
    
    workers._threadIt = new EventEmitter();
    
    while (i--) {
        const worker = new Worker(workerPath);
        
        assign(worker, {
            _threadItFree,
        });
        
        workers.push(worker);
    }
    
    return workers;
}

function terminateWorkers(workers) {
    for (const worker of workers) {
        worker.terminate();
    }
}

