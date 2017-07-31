/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "otherState" }]*/

/**
 * The base state defining the interface for actual state implementations
 */
export default class BaseFileState {

  /**
   * Constructs a new file state
   *
   * @param {Object} fileInfo Object containing existing state data
   */
  constructor(fileInfo) {
    if (!fileInfo || typeof fileInfo.path !== 'string') {
      throw new Error('Options object with at least a valid "path" is required to create a new file state.');
    }

    for (let propertyName of Object.keys(fileInfo)) {
      Object.defineProperty(this, '_' + propertyName, {
        value: fileInfo[propertyName],
        writable: true
      });
    }
  }

  /**
   * Gets the path to the file this state represents
   *
   * @return {string} Full path and filename
   */
  get path() {
    return this._path;
  }

  /**
   * Compares this file state against another state and checks wether they are
   * different or not.
   *
   * @param {FileState} otherState File state to check against
   * @return {Boolean} True if the two file states are different, false if not
   */
  isDifferentThan(otherState) {
    throw new Error('Override isDifferentThan to determine changes between two file states.');
  }

  /**
   * Returns the plain object representation of this state that can be passed to
   * JSON.stringify to persist it on disk
   *
   * @return {Object} Plain object representation of this state
   */
  toJson() {
    throw new Error('Override toJson to return the serialized file state that will be saved to disk.');
  }

}
