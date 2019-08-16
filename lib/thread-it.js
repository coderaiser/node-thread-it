'use strict';

const {promisify} = require('util');
const {cpus} = require('os');
const {join} = require('path');

const workerPath = join(__dirname, 'worker.js');

const holdUp = require('@iocmd/hold-up');
let workers = initWorkers();

const isWorkers = () => tryCatch(require, 'worker_threads');

const onMessage = (callback) => ([error, result]) => {
    callback(error, result);
};

const process = promisify((name, args, worker, callback) => {
    worker.once('message', onMessage(callback));
    worker.postMessage({
        message: 'run',
        data: {
            name,
            args,
        }
    });
});

module.exports = (name, additionalNames = []) => {
    if (!isWorkers) {
       const fn = require(name);
       
       return (...a) => fn(...a);
       return promisify((...args) => {
           const cb = args.pop();
           
           const [e, result] = tryCatch(fn, ...args);
           cb(e, result);
       });
    }
    
    sendRequire(workers, [name, ...additionalNames]);
    return async (...args) => {
        const worker = await holdUp([getFreeWorker, workers])
        const result = await process(name, args, worker);
        
        return result;
    };
};

module.exports.init = () => {
    workers = initWorkers();
};

module.exports.terminate = () => {
    terminateWorkers(workers);
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
    for (const worker of workers) {
        worker.terminate();
    }
}

const isFree = ({free}) => free;
function getFreeWorker(workers) {
    const {worker} = workers.find(isFree);
    return worker;
}

function sendRequire(workers, names) {
    for (const {worker} of workers) {
        worker.postMessage({
            message: 'require',
            data: {
                names,
            }
        });
    }
}

