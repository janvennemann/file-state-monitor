# file-state-monitor

> A different breed of file monitoring for NodeJS. Detect file changes between script runs.

## Description

Completely customizable monitoring for files that detects changes between two script runs. The state of all monitored files will be stored and compared to the current state on the next run to detect changes.

## Getting started

Install with npm

    npm i file-state-monitor --save

require and use it in your code:

```javascript
const FileMonitor = require('file-state-monitor').FileMonitor;
const FileStates = require('file-state-monitor').States

// Create a new file monitor and specificy the state change detection you want to use
let monitor = new FileMonitor(FileStates.LastModifiedState);
let stateFile = '/path/to/states.json';
monitor.load(stateFile);
monitor.monitorPath('/path/to/watch');
let changedFiles = monitor.getChangedFiles();
monitor.write(stateFile)
```

On the first run this will give you a `Map` of all files under the given path with a state of `created`. If you run the same script again you will get a list of `changed` or `deleted` files or. When no files changed an empty `Map` will be returned.

## Change detection strategies

This library uses special file state classes to let you choose which method you want to use to detect file changes. By subclassing the `BaseFileState` you can also define your own change detection strategy, giving you complete control about what files you consider as changed. File state implementations that come bundled with the library:

 * `LastModifiedState`: Uses the last modified timestamp to detect if a file changed
 * `SizeState`: Uses the file size to detect if a file changed
 * `ContentHashState`: Computes a SHA-1 hash of the file's content and uses that hash to detect if a file changed
* `CombinedState`: Uses all of the above checks in series, marking a file changed as soon as the first check returns true. Starts with the inexpensive checks for modification time and file size, and only then does the expensive content hash check.
