import fs from 'fs';
import BaseFileState from './BaseFileState';

/**
 * A file state using the last modified timestamp to detect changes
 */
export default class LastModifiedState extends BaseFileState {

  /**
   * Constructs a last modified timstamp aware state
   *
   * @param {Object} fileInfo Object containing existing state data
   */
  constructor(fileInfo) {
    super(fileInfo);

    if (Object.keys(fileInfo).length === 1) {
      let stat = fs.statSync(this.path);
      this._lastModified = stat.mtime.getTime();
    }
  }

  /**
   * Gets the last modification date of the file
   *
   * @return {number} Last modified date in miliseconds
   */
  get lastModified() {
    return this._lastModified;
  }

  /**
   * Checks if this file state is different than another by comparing their
   * SHA-1 content hashes
   *
   * @param {BaseFileState} otherState Other file state to check against
   * @return {boolean} True if the two file states are different, false if not
   */
  isDifferentThan(otherState) {
    if (this.path !== otherState.path) {
      throw new Error(`Can only compare files with the same path, but tried to compare ${this._path} with ${otherState.path}`);
    }

    return this.lastModified !== otherState.lastModified;
  }

  /**
   * @inheritdoc
   */
  toJson() {
    return {
      path: this.path,
      lastModified: this.lastModified
    };
  }

}
