import { expect } from 'chai';
import mock from 'mock-fs';
import sinon from 'sinon';
import { ContentHashState } from '../lib/states';

describe('ContentHashState', () => {
  let testFilename = 'test.txt';
  let testContent = 'Hash this!';
  let testContentHash = 'c2ed55283b7e9050c77b97064fed220afaea3bf7';

  beforeEach(() => {
    mock({
      [testFilename]: mock.file({
        content: testContent
      }),
      'other.txt': 'other content'
    });
  });

  afterEach(() => {
    mock.restore();
  });

  describe('constructor', () => {
    it('should set _sha1 property to null if not given', () => {
      let state = new ContentHashState({
        path: testFilename
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state._sha1).to.be.null;
    });

    it('should assign passed values to properties', () => {
      let state = new ContentHashState({
        path: testFilename,
        sha1: testContentHash,
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.sha1).to.be.equal(testContentHash);
    });
  });

  describe('computeSha1', () => {
    it('should compute SHA-1 for file content', () => {
      let state = new ContentHashState({
        path: testFilename
      });
      expect(state.computeSha1()).to.be.equal(testContentHash);
    });

    it('should only compute SHA-1 on demand', () => {
      let state = new ContentHashState({
        path: testFilename
      });
      let spy = sinon.spy(state, 'computeSha1');
      expect(state._sha1).to.be.null;
      expect(spy.called).to.be.false;
      expect(state.sha1).to.be.equal(testContentHash);
      expect(spy.called).to.be.true;
      expect(state._sha1).to.be.equal(testContentHash);
    });
  });

  describe('isDifferentThan', () => {
    it('should throw error if comparing different files', () => {
      let state1 = new ContentHashState({
        path: testFilename
      });
      let state2 = new ContentHashState({
        path: 'other.txt'
      });
      expect(() => {
        state1.isDifferentThan(state2);
      }).to.throw(`Can only compare files with the same path, but tried to compare ${state1.path} with ${state2.path}`);
    });

    it('should return true for different SHA-1 hashes', () => {
      let state1 = new ContentHashState({
        path: testFilename
      });
      let state2 = new ContentHashState({
        path: testFilename,
        sha1: 'hash'
      });
      expect(state1.isDifferentThan(state2)).to.be.true;
    });

    it('should return false if SHA-1 hashes are the same', () => {
      let state1 = new ContentHashState({
        path: testFilename
      });
      let state2 = new ContentHashState({
        path: testFilename
      });
      expect(state1.isDifferentThan(state2)).to.be.false;
    });
  });

  describe('toJson', () => {
    it('should serialize required state data', () => {
      let stateData = {
        path: testFilename,
        sha1: testContentHash
      };
      let state = new ContentHashState({path: testFilename});
      expect(state.toJson()).to.be.deep.equal(stateData);
    });
  });
});
