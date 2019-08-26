# Thread It [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

Drastically simplified [worker threads](https://nodejs.org/dist/latest-v12.x/docs/api/worker_threads.html), on node `v8` or `v10` without `--experimental-worker` just
wraps your code with a promise so you don't have to warry about a thing, just use `thread it` and it will use `workers` where can.

Choose any sync module from `npm` and instead of `require` use `threadIt`.

*Caution: not all data types can be passed to Worker Thread, for example you just can't pass a function, read carefully [what types are supported](https://nodejs.org/dist/latest-v12.x/docs/api/worker_threads.html#worker_threads_port_postmessage_value_transferlist).*

## Install

`npm i thread-it`

## API

### threadIt(name[, options])

Under the hood `threadId` uses [holdUp](https://github.com/coderaiser/hold-up) so you can use the same options to find a free worker from queue.

- `name` - string
- `options` - options may contain:
  - `log`
  - `count`
  - `time`

Also you can set `THREAD_IT_COUNT` env variable to workers count, if `0` it means disabled worker threads.
```js
const threadIt = require('thread-it');

// init workers, depend on os.cpus()
threadIt.init();

const putout = threadIt('putout');
const result = await putout(`const t = 'hello'`);

// when you need to override options use
threadIt('putout', {
    count: 5,       // default
    time: 1000,     // default
    log: () => {},  // default
});

// terminate workers when no need anymore
threadIt.terminate();
```

## Related

- [hold-up](https://github.com/iocmd/hold-up "Hold Up") - setInterval with promises, counter and error handling
- [currify](https://github.com/coderaiser/currify "currify") - translate the evaluation of a function that takes multiple arguments into evaluating a sequence of functions, each with a single or more arguments.
- [fullstore](https://github.com/coderaiser/fullstore "fullstore") - functional variables.
- [wraptile](https://github.com/coderaiser/wraptile "wraptile") - translate the evaluation of a function that takes multiple arguments into evaluating a sequence of 2 functions, each with a any count of arguments.

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/thread-it.svg?style=flat
[BuildStatusIMGURL]:        https://travis-ci.com/coderaiser/node-thread-it.svg?branch=master
[DependencyStatusIMGURL]:   https://img.shields.io/david/coderaiser/node-thread-it.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPMURL]:                   https://npmjs.org/package/thread-it "npm"
[BuildStatusURL]:           https://travis-ci.com/coderaiser/node-thread-it  "Build Status"
[DependencyStatusURL]:      https://david-dm.org/coderaiser/node-thread-it "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

[CoverageURL]:              https://coveralls.io/github/coderaiser/node-thread-it?branch=master
[CoverageIMGURL]:           https://coveralls.io/repos/coderaiser/node-thread-it/badge.svg?branch=master&service=github
