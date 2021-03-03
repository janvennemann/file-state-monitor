import fs from 'fs-extra';
import path from 'path';
import { BaseFileState } from './states';

const FILE_STATUS_CREATED = 'created';
const FILE_STATUS_CHANGED = 'changed';
const FILE_STATUS_DELETED = 'deleted';

/**
 * Monitors the state for a set of files
 */
export default class FileMonitor {

  /**
   * Constrcuts a new FileStateManager using the given file state implementation
   * to compare files
   */
  constructor(fileStateClass) {
    /**
     * Map of the initially loaded files from the state file
     *
     * @type {Map.<string, BaseFileState>}
     * @private
     */
    this._loadedFiles = new Map();

    /**
     * Map containing processed files
     *
     * @type {Map.<string, BaseFileState>}
     * @private
     */
    this._processedFiles = new Map();

    /**
     * Map with state of changed files
     *
     * @type {Map.<string, string>}
     * @private
     */
    this._changedFiles = new Map();

    if (!fileStateClass || !(fileStateClass.prototype instanceof BaseFileState)) {
      throw new TypeError('You need to provide a valid file state class which extends BaseFileState');
    }
    /**
     * The file state class used to compare two files
     *
     * @type {BaseFileState}
     * @private
     */
    this._fileStateClass = fileStateClass;
  }

  static get FILE_STATUS_CREATED() {
    return FILE_STATUS_CREATED;
  }

  static get FILE_STATUS_CHANGED() {
    return FILE_STATUS_CHANGED;
  }

  static get FILE_STATUS_DELETED() {
    return FILE_STATUS_DELETED;
  }

  /**
   * Loads cached file state information from a state file into this FileMonitor
   * instance
   *
   * Returns true opon successfully loading the previous state file. If no
   * previous state file is available or its content can not be parsed, this
   * method will return false and the FileMonitor instance is left untouched.
   *
   * @param {string} statePathAndFilename Full path to the state file
   * @return {boolean} True if the state file was loaded successfully, false if not
   */
  load(statePathAndFilename) {
    if (!fs.existsSync(statePathAndFilename)) {
      return false;
    }

    try {
      let stateJson = JSON.parse(fs.readFileSync(statePathAndFilename).toString());
      for (let stateEntry of stateJson.files) {
        let fileState = new this._fileStateClass(stateEntry);
        this._loadedFiles.set(fileState.path, fileState);
      }

      return true;
    } catch (e) {
      // possibly corrupted state data, just silently ignore it
    }

    return false;
  }

  /**
   * Write the current file states back to disk
   *
   * @param {string} statePathAndFilename Full path to the state file
   */
  write(statePathAndFilename) {
    let stateData = {
      files: []
    };
    for (let fileState of this._processedFiles.values()) {
      stateData.files.push(fileState.toJson());
    }
    fs.ensureDirSync(path.dirname(statePathAndFilename));
    fs.writeFileSync(statePathAndFilename, JSON.stringify(stateData));
  }

  /**
   * Monitor a new file or directory with this state monitor
   *
   * @param {string} pathToMonitor Full path of the file or directory to be monitored
   */
  monitorPath(pathToMonitor) {
    if (!fs.existsSync(pathToMonitor)) {
      return;
    }

    let stats = fs.lstatSync(pathToMonitor);
    if (stats.isFile() || stats.isSymbolicLink()) {
      this.updateFileState(pathToMonitor);
    } else if (stats.isDirectory()) {
      for (let entryName of fs.readdirSync(pathToMonitor)) {
        let fullPath = path.join(pathToMonitor, entryName);
        this.monitorPath(fullPath);
      }
    }
  }

  /**
   * Detects changes to the file and updates its state
   *
   * If the file did not exists in our loaded state before, add it as a new one.
   * For existing files check wether they have changed and update the file states
   * map and move them from the loaded map to processed.
   *
   * @param {string} pathAndFilename Full path and filename of the file to update
   * @private
   */
  updateFileState(pathAndFilename) {
    let newFileState = new this._fileStateClass({path: pathAndFilename});
    let existingFileState = this._loadedFiles.get(pathAndFilename);
    if (existingFileState === undefined) {
      this._changedFiles.set(pathAndFilename, FILE_STATUS_CREATED);
      this._processedFiles.set(pathAndFilename, newFileState);
    } else {
      this._loadedFiles.delete(pathAndFilename);
      if (newFileState.isDifferentThan(existingFileState)) {
        this._changedFiles.set(pathAndFilename, FILE_STATUS_CHANGED);
        this._processedFiles.set(pathAndFilename, newFileState);
      } else {
        this._processedFiles.set(pathAndFilename, existingFileState);
      }
    }
  }

  /**
   * Updates the file monitor with the set of paths, replacing any previously
   * monitored files.
   *
   * @param {Array.<string>} paths Array of new paths to monitor
   */
  update(paths) {
    if (!Array.isArray(paths)) {
      throw new TypeError('The file monitor needs to be updated with an array of paths.');
    }

    this._loadedFiles.clear();
    this._processedFiles.forEach((fileState, path) => {
      this._loadedFiles.set(path, fileState);
    });
    this._processedFiles.clear();
    this._changedFiles.clear();
    paths.forEach(path => {
      this.monitorPath(path);
    });
  }

  /**
   * Gets a map of all changed files and their respective FILE_STATUS_* value
   *
   * @return {Map.<string, string>}
   */
  getChangedFiles() {
    let changedFiles = new Map(this._changedFiles);
    for (let removedFile of this._loadedFiles.values()) {
      changedFiles.set(removedFile.path, FILE_STATUS_DELETED);
    }
    return changedFiles;
  }

}
