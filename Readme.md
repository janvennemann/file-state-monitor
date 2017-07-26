# file-state-monitor

> A slightly different breed of file monitoring for NodeJS. Detect file changes between script runs.

## Description

Completely customizable monitoring for files that detects changes between two script runs. The state of all monitored files will be stored and compared to the current state on the next run to detect changes.

## Getting started

Install with npm

`npm i file-state-monitor --save`

require and use it in your code:

```javascript
const FileMonitor = require('file-state-monitor').FileMonitor;
const FileStates = require('file-state-monitor').States

let monitor = new FileMonitor(FileStates.LastModifiedState);
let stateFile = '/path/to/states.json';
monitor.load(stateFile);
monitor.monitorPath('/path/to/watch');
let changedFiles = monitor.getChangedFiles();
monitor.write(stateFile);
```

On the first run this will give you a `Map` of all files under the given path with a state of `created`. If you run the script again you will get a list of `changed` or `deleted` files. When no files changed an empty `Map` will be returned.

The API is pretty much self explanatory. You first create a new `FileMonitor` and pass one of the available [#change-detection-strategies](change detection strategies). After that `load()` the previous state from disk and add directories or files you want to monitor with `monitorPath()`. Calling this will compare the files with their previous state and you can get a list of changed files with `getChangedFiles()`. To persist the state back to disk simply call `write()` on the file monitor instance.

Visit the GitHub Pages for a complete [https://janvennemann.github.io/file-state-monitor/?api](API documentation).

## Change detection strategies

This library uses special file state classes to let you choose which method you want to use to detect file changes. By subclassing the `BaseFileState` you can also define your own change detection strategy, giving you complete control about what files you consider as changed. File state implementations that come bundled with the library:

* `LastModifiedState`: Uses the last modified timestamp to detect if a file changed
* `SizeState`: Uses the file size to detect if a file changed
* `ContentHashState`: Computes a SHA-1 hash of the file's content and uses that hash to detect if a file changed
* `CombinedState`: Uses all of the above checks in series, marking a file changed as soon as the first check returns true. Starts with the inexpensive checks for modification time and file size, and only then does the expensive content hash check.
