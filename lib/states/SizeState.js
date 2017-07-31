import fs from 'fs';
import BaseFileState from './BaseFileState';

/**
 * A file state using size of the file to detect changes
 */
export default class SizeState extends BaseFileState {

  /**
   * Constructs a new file size aware state
   *
   * @param {Object} fileInfo Object containing existing state data
   */
  constructor(fileInfo) {
    super(fileInfo);

    if (Object.keys(fileInfo).length === 1) {
      let stat = fs.statSync(this.path);
      this._size = stat.size;
    }
  }

  /**
   * Gets the size of the file
   *
   * @return {number} Size of the file in bytes
   */
  get size() {
    return this._size;
  }

  /**
   * Checks if this file state is different than another by comparing their
   * file size
   *
   * @param {BaseFileState} otherState Other file state to check against
   * @return {boolean} True if the two file states are different, false if not
   */
  isDifferentThan(otherState) {
    if (this.path !== otherState.path) {
      throw new Error(`Can only compare files with the same path, but tried to compare ${this._path} with ${otherState.path}`);
    }

    return this.size !== otherState.size;
  }

  /**
   * @inheritdoc
   */
  toJson() {
    return {
      path: this.path,
      size: this.size
    };
  }

}
