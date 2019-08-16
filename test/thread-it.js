'use strict';

const test = require('supertape');
const tryToCatch = require('try-to-catch');
const tryCatch = require('try-catch');
const mockRequire = require('mock-require');
const threadIt = require('..');

const {stopAll, reRequire} = mockRequire;

test('thread-it', async (t) => {
    threadIt.init();
    
    const putout = threadIt('putout');
    
    const result = await putout('const t = 5');
    threadIt.terminate();
    
    t.deepEqual(result.places, []);
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

test('thread-it: memory leak', async (t) => {
    threadIt.init();
    const [e] = tryCatch(threadIt.init);
    threadIt.terminate();
    
    t.equal(e.message, `Terminate existing workers first!`);
    t.end();
});

test('thread-it', async (t) => {
    const [e] = tryCatch(threadIt, 'putout');
    
    t.equal(e.message, `You should init workers first!`);
    t.end();
});

test('thread-it: no worker_threads', async (t) => {
    mockRequire('try-catch', (fn, name, ...a) => {
        if (name === 'worker_threads')
            return [Error('xxx')];
        
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
