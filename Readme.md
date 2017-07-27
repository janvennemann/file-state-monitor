# file-state-monitor

[![Travis Build Status](https://travis-ci.org/janvennemann/file-state-monitor.svg?branch=master)](https://travis-ci.org/janvennemann/file-state-monitor)
[![Appveyor Build status](https://ci.appveyor.com/api/projects/status/p5gakno7oj276abs?svg=true)](https://ci.appveyor.com/project/janvennemann/file-state-monitor)
[![Coverage Status](https://coveralls.io/repos/github/janvennemann/file-state-monitor/badge.svg?branch=develop)](https://coveralls.io/github/janvennemann/file-state-monitor?branch=develop)
[![Dependencies](https://david-dm.org/janvennemann/file-state-monitor.svg)](https://david-dm.org/janvennemann/file-state-monitor)

> Completely customizable file monitoring using states, allowing file changes to be detected between script runs.

## Description

A slightly different breed of file monitoring for NodeJS. The state of all monitored files will be stored and compared to the current state on the next run to detect changes. It is heavily inspired by the file change detection used by [Gradle](https://gradle.org/) for incremental task runs.

## Getting started

Install with npm

`npm i file-state-monitor --save`

require and use it in your code:

```javascript
const FileMonitor = require('file-state-monitor').FileMonitor;
const LastModifiedState = require('file-state-monitor').LastModifiedState

let monitor = new FileMonitor(LastModifiedState);
let stateFile = '/path/to/states.json';
monitor.load(stateFile);
monitor.monitorPath('/path/to/watch');
let changedFiles = monitor.getChangedFiles();
monitor.write(stateFile);
```

On the first run this will give you a `Map` of all files under the given path with a state of `created`. If you run the script again you will get a list of `changed` or `deleted` files. When no files changed an empty `Map` will be returned.

The API is pretty much self explanatory. You first create a new `FileMonitor` and pass one of the available [change detection strategies](#change-detection-strategies). After that `load()` the previous state from disk and add directories or files you want to monitor with `monitorPath()`. Calling this will compare the files with their previous state and you can get a list of changed files with `getChangedFiles()`. To persist the state back to disk simply call `write()` on the file monitor instance.

Visit https://janvennemann.github.io/file-state-monitor/?api for a complete API documentation.

## Change detection strategies

This library uses special file state classes to let you choose which method you want to use to detect file changes. By subclassing the `BaseFileState` you can also define your own change detection strategy, giving you complete control about what files you consider as changed. File state implementations that come bundled with the library:

* `LastModifiedState`: Uses the last modified timestamp to detect if a file changed
* `SizeState`: Uses the file size to detect if a file changed
* `ContentHashState`: Computes a SHA-1 hash of the file's content and uses that hash to detect if a file changed
* `CombinedState`: Uses all of the above checks in series, marking a file changed as soon as the first check returns true. Starts with the inexpensive checks for modification time and file size, and only then does the expensive content hash check.

### Write your own state

Need a more sophisticated check other than only checking file modification time, size or content hash? No problem, just create you own state class that extends from [BaseFileState](https://janvennemann.github.io/file-state-monitor/?api#BaseFileState). For a proper implementation you are required to at least define your own `isDifferentThan` and `toJson` methods. Everything else is up to you. Take a look at the [bundles states](/lib/states) to get an idea of how it works.
