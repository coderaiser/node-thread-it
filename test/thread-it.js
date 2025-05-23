'use strict';

const {EventEmitter} = require('node:events');
const process = require('node:process');
const {test, stub} = require('supertape');

const tryToCatch = require('try-to-catch');
const tryCatch = require('try-catch');
const mockRequire = require('mock-require');
const wait = require('@iocmd/wait');
const threadIt = require('..');

const {stopAll, reRequire} = mockRequire;
const {assign} = Object;

test('thread-it: happy path', async (t) => {
    threadIt.init();
    
    const putout = threadIt('putout');
    
    const result = await putout('const t = 5');
    threadIt.terminate();
    
    t.deepEqual(result.places, []);
    t.end();
});

test('thread-it: run: no free worker', async (t) => {
    const worker = assign(new EventEmitter(), {
        postMessage: stub(),
    });
    
    const workers = [worker];
    
    workers._threadIt = new EventEmitter();
    
    const name = 'abc';
    const args = [];
    
    const emitThreadIt = workers._threadIt.emit.bind(workers._threadIt);
    const emitWorker = worker.emit.bind(worker);
    
    const [result] = await Promise.all([
        threadIt._run({
            name,
            args,
            workers,
        }),
        emitThreadIt('free-worker', worker),
        wait(500, emitWorker.bind(null, 'message', [null, 'hello'])),
    ]);
    
    t.equal(result, 'hello');
    t.end();
});

test('thread-it: error', async (t) => {
    threadIt.init();
    
    const putout = threadIt('putout');
    
    const [e] = await tryToCatch(putout, 'const t = ');
    threadIt.terminate();
    
    t.equal(e.message, `Unexpected token (1:10)`);
    t.end();
});

test('thread-it: memory leak', (t) => {
    threadIt.init();
    
    const [e] = tryCatch(threadIt.init);
    
    threadIt.terminate();
    
    t.notOk(e, `run init as many times as you wish, if works exists init does nothing`);
    t.end();
});

test('thread-it: env', async (t) => {
    const {THREAD_IT_COUNT} = process.env;
    
    process.env.THREAD_IT_COUNT = 2;
    
    const threadIt = reRequire('..');
    const putout = threadIt('putout');
    const [e] = await tryToCatch(putout, `const t = 'hello'`);
    
    process.env.THREAD_IT_COUNT = THREAD_IT_COUNT;
    
    t.equal(e.message, `You should init workers first!`);
    t.end();
});

test('thread-it: no worker_threads: throws', async (t) => {
    mockRequire('try-catch', (fn, name, ...a) => {
        if (name === 'worker_threads')
            return [
                Error('xxx'),
            ];
        
        return tryCatch(fn, name, ...a);
    });
    
    const threadIt = reRequire('..');
    
    threadIt.init();
    const putout = threadIt('putout');
    const result = await putout('const t = 5');
    
    threadIt.terminate();
    stopAll();
    
    t.deepEqual(result.places, []);
    t.end();
});

test('thread-it: no worker_threads', async (t) => {
    process.env.THREAD_IT_COUNT = '0';
    
    const threadIt = reRequire('..');
    
    threadIt.init();
    const putout = threadIt('putout');
    const result = await putout('const t = 5');
    
    threadIt.terminate();
    stopAll();
    delete process.env.THREAD_IT_COUNT;
    
    t.deepEqual(result.places, []);
    t.end();
});

test('thread-it: a couple: correct order', async (t) => {
    threadIt.init();
    
    const putout1 = threadIt('putout');
    const putout2 = threadIt('putout');
    
    const code = 'const t = 5;\n';
    await Promise.all([
        putout1(code),
        putout1(code),
        putout1(code),
    ]);
    
    const result1 = await putout1(code);
    
    const result2 = await putout2(code, {
        plugins: [
            'remove-unused-variables',
        ],
    });
    
    threadIt.terminate();
    
    t.equal(result1.code, code);
    t.equal(result2.code, '\n');
    t.end();
}, {
    checkAssertionsCount: false,
});
