import { expect } from 'chai';
import mock from 'mock-fs';
import { LastModifiedState } from '../lib/states';

describe('LastModifiedState', () => {
  let testFilename = 'test.txt';
  let testContent = 'Hash this!';
  let lastModifiedDate = new Date('2017-07-04T00:00:00Z');
  let lastModifiedDateInMilliseconds = lastModifiedDate.getTime();

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
    it('should automatically set _lastModified property if not given', () => {
      let state = new LastModifiedState({
        path: testFilename
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state._lastModified).to.be.equal(lastModifiedDateInMilliseconds);
    });

    it('should assign passed values to properties', () => {
      let state = new LastModifiedState({
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds,
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.lastModified).to.be.equal(lastModifiedDateInMilliseconds);
    });
  });

  describe('isDifferentThan', () => {
    it('should throw error if comparing different files', () => {
      let state1 = new LastModifiedState({
        path: testFilename
      });
      let state2 = new LastModifiedState({
        path: 'other.txt'
      });
      expect(() => {
        state1.isDifferentThan(state2);
      }).to.throw(`Can only compare files with the same path, but tried to compare ${state1.path} with ${state2.path}`);
    });

    it('should return true for different modification times', () => {
      let changedLastModifiedDate = new Date(lastModifiedDateInMilliseconds);
      changedLastModifiedDate.setUTCSeconds(1);
      let state1 = new LastModifiedState({
        path: testFilename
      });
      let state2 = new LastModifiedState({
        path: testFilename,
        lastModified: changedLastModifiedDate
      });
      expect(state1.isDifferentThan(state2)).to.be.true;
    });

    it('should return false if last modified timestamps are the same', () => {
      let state1 = new LastModifiedState({
        path: testFilename
      });
      let state2 = new LastModifiedState({
        path: testFilename
      });
      expect(state1.isDifferentThan(state2)).to.be.false;
    });
  });

  describe('toJson', () => {
    it('should serialize required state data', () => {
      let stateData = {
        path: testFilename,
        lastModified: lastModifiedDateInMilliseconds
      };
      let state = new LastModifiedState({path: testFilename});
      expect(state.toJson()).to.be.deep.equal(stateData);
    });
  });
});
