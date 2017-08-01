import { expect } from 'chai';
import mock from 'mock-fs';
import sinon from 'sinon';
import { SmartState } from '../lib/states';

describe('SmartState', () => {
  let lastModifiedDate = new Date('2017-07-04T00:00:00Z');
  let lastModifiedDateInMilliseconds = lastModifiedDate.getTime();
  let testFilename = 'test.txt';
  let testContent = 'Hash this!';
  let testContentHash = 'c2ed55283b7e9050c77b97064fed220afaea3bf7';

  beforeEach(() => {
    mock({
      [testFilename]: mock.file({
        content: testContent,
        mtime: lastModifiedDate
      }),
      'other.txt': 'other content'
    });
  });

  afterEach(() => {
    mock.restore();
  });

  describe('constructor', () => {
    it('should read lastModified and size from file if only path is given', () => {
      let state = new SmartState({
        path: testFilename
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.lastModified).to.be.equal(lastModifiedDate.getTime());
      expect(state.size).to.be.equal(testContent.length);
      expect(state._sha1).to.be.null;
    });

    it('should assign passed values to properties', () => {
      let state = new SmartState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds,
        size: testContent.length,
        sha1: testContentHash
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.lastModified).to.be.equal(lastModifiedDate.getTime());
      expect(state.size).to.be.equal(testContent.length);
    });
  });

  describe('computeSha1', function () {
    it('should compute SHA-1 for file content', () => {
      let expectedHash = 'c2ed55283b7e9050c77b97064fed220afaea3bf7';
      let state = new SmartState({
        path: testFilename
      });
      expect(state.computeSha1()).to.be.equal(expectedHash);
    });

    it('should only compute SHA-1 on demand', () => {
      let expectedHash = 'c2ed55283b7e9050c77b97064fed220afaea3bf7';
      let state = new SmartState({
        path: testFilename
      });
      let spy = sinon.spy(state, 'computeSha1');
      expect(state._sha1).to.be.null;
      expect(spy.called).to.be.false;
      expect(state.sha1).to.be.equal(expectedHash);
      expect(spy.called).to.be.true;
      expect(state._sha1).to.be.equal(expectedHash);
    });
  });

  describe('isDifferentThan', () => {
    let changedLastModifiedDate = new Date(lastModifiedDateInMilliseconds);
    changedLastModifiedDate.setUTCSeconds(1);

    it('should throw error if comparing different files', () => {
      let state1 = new SmartState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds
      });
      let state2 = new SmartState({
        path: 'other.txt',
        lastModified: lastModifiedDateInMilliseconds
      });
      expect(() => {
        state1.isDifferentThan(state2);
      }).to.throw(`Can only compare files with the same path, but tried to compare ${state1.path} with ${state2.path}`);
    });

    it('should return false if modification time is the same', () => {
      let state1 = new SmartState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds
      });
      let state2 = new SmartState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds
      });
      expect(state1.isDifferentThan(state2)).to.be.false;
    });

    it('should return true if file was modified and is different size', () => {
      let state1 = new SmartState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds,
        size: 1
      });
      let state2 = new SmartState({
        path: testFilename,
        lastModified: changedLastModifiedDate.getTime(),
        size: 2
      });
      expect(state1.isDifferentThan(state2)).to.be.true;
    });

    it('should return true if file was modified, is same size but has different content hash', () => {
      let state1 = new SmartState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds,
        size: 1,
        sha1: '86f7e437faa5a7fce15d1ddcb9eaeaea377667b8' // SHA-1 of 'a'
      });
      let state2 = new SmartState({
        path: testFilename,
        lastModified: changedLastModifiedDate.getTime(),
        size: 1,
        sha1: 'e9d71f5ee7c92d6dc9e92ffdad17b8bd49418f98' // SHA-1 of 'b'
      });
      expect(state1.isDifferentThan(state2)).to.be.true;
    });
  });

  describe('toJson', () => {
    it('should serialize required state data', () => {
      let stateData = {
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds,
        size: testContent.length,
        sha1: testContentHash
      };
      let state = new SmartState({path: testFilename});
      expect(state.toJson()).to.be.deep.equal(stateData);
    });
  });

});
