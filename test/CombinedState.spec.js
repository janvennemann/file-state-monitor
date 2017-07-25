import { expect } from 'chai';
import mock from 'mock-fs';
import { CombinedState } from '../lib/states/index';

describe('CombinedState', () => {
  let lastModifiedDate = new Date('2017-07-04T00:00:00Z');
  let lastModifiedDateInMilliseconds = lastModifiedDate.getTime();

  describe('constructor', () => {
    let testFilename = 'constructor.txt';
    let testContent = 'constructor test';

    beforeEach(() => {
      mock({
        [testFilename]: mock.file({
          content: testContent,
          mtime: lastModifiedDate
        })
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('should read lastModified and size from file if only path is given', () => {
      let state = new CombinedState({
        path: testFilename
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.lastModified).to.be.equal(lastModifiedDate.getTime());
      expect(state.size).to.be.equal(testContent.length);
    });

    it('should assign passed values to properties', () => {
      let state = new CombinedState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds,
        size: testContent.length
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.lastModified).to.be.equal(lastModifiedDate.getTime());
      expect(state.size).to.be.equal(testContent.length);
    });
  });

  describe('computeSha1', function () {
    let testFilename = 'computeSha1.txt';
    let testContent = 'Hash this!';

    beforeEach(() => {
      mock({
        [testFilename]: testContent
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('should compute SHA-1 for file content', () => {
      let expectedHash = 'c2ed55283b7e9050c77b97064fed220afaea3bf7';
      let state = new CombinedState({
        path: testFilename
      });
      expect(state.computeSha1()).to.be.equal(expectedHash);
    });

    it('should only compute SHA-1 on demand', () => {
      let expectedHash = 'c2ed55283b7e9050c77b97064fed220afaea3bf7';
      let state = new CombinedState({
        path: testFilename
      });
      expect(state._sha1).to.be.null;
      expect(state.sha1).to.be.equal(expectedHash);
      expect(state._sha1).to.be.equal(expectedHash);
    });
  });

  describe('isDifferentThan', () => {
    let changedLastModifiedDate = new Date(lastModifiedDateInMilliseconds);
    changedLastModifiedDate.setUTCSeconds(1);

    before(() => {
      mock({
        'test.txt': 'dummy content',
        'other.txt': 'other content'
      });
    });

    after(() => {
      mock.restore();
    });

    it('should throw error if comparing different files', () => {
      let state1 = new CombinedState({
        path: 'test.txt',
        lastModified: lastModifiedDateInMilliseconds
      });
      let state2 = new CombinedState({
        path: 'other.txt',
        lastModified: lastModifiedDateInMilliseconds
      });
      expect(() => {
        state1.isDifferentThan(state2);
      }).to.throw(`Can only compare files with the same path, but tried to compare ${state1.path} with ${state2.path}`);
    });

    it('should return false if modification time is the same', () => {
      let state1 = new CombinedState({
        path: 'test.txt',
        lastModified: lastModifiedDateInMilliseconds
      });
      let state2 = new CombinedState({
        path: 'test.txt',
        lastModified: lastModifiedDateInMilliseconds
      });
      expect(state1.isDifferentThan(state2)).to.be.false;
    });

    it('should return true if file was modified and is different size', () => {
      let state1 = new CombinedState({
        path: 'test.txt',
        lastModified: lastModifiedDateInMilliseconds,
        size: 1
      });
      let state2 = new CombinedState({
        path: 'test.txt',
        lastModified: changedLastModifiedDate.getTime(),
        size: 2
      });
      expect(state1.isDifferentThan(state2)).to.be.true;
    });

    it('should return true if file was modified, is same size but has different content hash', () => {
      let state1 = new CombinedState({
        path: 'test.txt',
        lastModified: lastModifiedDateInMilliseconds,
        size: 1,
        sha1: '86f7e437faa5a7fce15d1ddcb9eaeaea377667b8'
      });
      let state2 = new CombinedState({
        path: 'test.txt',
        lastModified: changedLastModifiedDate.getTime(),
        size: 1,
        sha1: 'e9d71f5ee7c92d6dc9e92ffdad17b8bd49418f98'
      });
      expect(state1.isDifferentThan(state2)).to.be.true;
    });
  });

  describe('toJson', () => {
    before(() => {
      mock({
        'test.txt': 'a'
      });
    });

    after(() => {
      mock.restore();
    });

    it('should serialize required state data', () => {
      let stateData = {
        path: 'test.txt',
        lastModified: lastModifiedDateInMilliseconds,
        size: 42,
        sha1: '86f7e437faa5a7fce15d1ddcb9eaeaea377667b8'
      };
      let state = new CombinedState(stateData);
      expect(state.toJson()).to.be.deep.equal(stateData);
    });
  });

});
