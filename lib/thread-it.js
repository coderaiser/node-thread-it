'use strict';

const {promisify} = require('util');
const {cpus} = require('os');
const {join} = require('path');
const {once, EventEmitter} = require('events');

const tryCatch = require('try-catch');
const wait = require('@iocmd/wait');

const workerPath = join(__dirname, 'worker.js');
const {THREAD_IT_COUNT} = process.env;
const workersCount = isNaN(THREAD_IT_COUNT) ? cpus().length : Number(THREAD_IT_COUNT);

const workersDisabled = () => {
    if (!workersCount)
        return true;
    
    const [e] = tryCatch(require, 'worker_threads');
    return e;
};

const run = async ({name, args, worker, workers}) => {
    const postMessage = worker.postMessage.bind(worker);
    
    const [[message]] = await Promise.all([
        once(worker, 'message'),
        wait(postMessage, {
            name,
            args,
        });
    ]);
    
    worker._threadit.emit('ready', worker);
    
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
        
        const worker = await getFreeWorker(workers);
        const result = await run({
            name,
            args,
            worker,
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
    const workers._threadIt = new EventEmitter();
    
    while (i--) {
        const worker = new Worker(workerPath);
        
        workers.push(worker);
    }
    
    return workers;
}

function terminateWorkers(workers) {
    for (const worker of workers) {
        worker.terminate();
    }
}

const getFreeWorker = async (workers) => {
    const [worker] = await once(workers._threadit, 'ready');
    worker.free = false;
    return worker;
};

