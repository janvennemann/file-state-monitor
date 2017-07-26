import crypto from 'crypto';
import fs from 'fs';
import BaseFileState from './BaseFileState';

export default class ContentHashState extends BaseFileState {

  /**
   * Constructs a new content hash state
   *
   * @param {Object} fileInfo Object containing existing state data
   */
  constructor(fileInfo) {
    super(fileInfo);

    if (Object.keys(fileInfo).length === 1) {
      this._sha1 = null;
    }
  }

  /**
   * Gets the SHA-1 hash of the file's content
   *
   * @return {string} SHA-1 content hash
   */
  get sha1() {
    if (this._sha1 === null) {
      this._sha1 = this.computeSha1();
    }
    return this._sha1;
  }

  /**
   * Computes the sha1 hash of the files content
   *
   * @return {string} Computed sha1 hash
   */
  computeSha1() {
    let hash = crypto.createHash('sha1');
    hash.update(fs.readFileSync(this.path));
    return hash.digest('hex');
  }

  /**
   * Checks if this file state is different than another by comparing their
   * SHA-1 content hashes
   *
   * @param {BaseFileState} otherState Other file state to check against
   * @return {Boolean} True if the two file states are different, false if not
   */
  isDifferentThan(otherState) {
    if (this.path !== otherState.path) {
      throw new Error(`Can only compare files with the same path, but tried to compare ${this._path} with ${otherState.path}`);
    }

    return this.sha1 !== otherState.sha1;
  }

  /**
   * @inheritdoc
   */
  toJson() {
    return {
      path: this.path,
      sha1: this.sha1
    };
  }

}
