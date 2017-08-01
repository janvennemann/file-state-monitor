import { expect } from 'chai';
import mock from 'mock-fs';
import { SizeState } from '../lib/states';

describe('SizeState', () => {
  let testFilename = 'test.txt';
  let testContent = 'Hash this!';

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
    it('should automatically set _size property if not given', () => {
      let state = new SizeState({
        path: testFilename
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.size).to.be.equal(testContent.length);
    });

    it('should assign passed values to properties', () => {
      let size = 5;
      let state = new SizeState({
        path: testFilename,
        size: size,
      });
      expect(state.path).to.be.equal(testFilename);
      expect(state.size).to.be.equal(size);
    });
  });

  describe('isDifferentThan', () => {
    it('should throw error if comparing different files', () => {
      let state1 = new SizeState({
        path: testFilename
      });
      let state2 = new SizeState({
        path: 'other.txt'
      });
      expect(() => {
        state1.isDifferentThan(state2);
      }).to.throw(`Can only compare files with the same path, but tried to compare ${state1.path} with ${state2.path}`);
    });

    it('should return true for different file sizes', () => {
      let state1 = new SizeState({
        path: testFilename
      });
      let state2 = new SizeState({
        path: testFilename,
        size: testContent.length + 1
      });
      expect(state1.isDifferentThan(state2)).to.be.true;
    });

    it('should return false if file sizes are the same', () => {
      let state1 = new SizeState({
        path: testFilename
      });
      let state2 = new SizeState({
        path: testFilename
      });
      expect(state1.isDifferentThan(state2)).to.be.false;
    });
  });

  describe('toJson', () => {
    it('should serialize required state data', () => {
      let stateData = {
        path: testFilename,
        size: testContent.length
      };
      let state = new SizeState({path: testFilename});
      expect(state.toJson()).to.be.deep.equal(stateData);
    });
  });
});
