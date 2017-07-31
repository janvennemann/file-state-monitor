import { expect } from 'chai';
import mock from 'mock-fs';
import { BaseFileState } from '../lib/states';

describe('BaseFileState', () => {
  let testFilename = 'test.txt';

  beforeEach(() => {
    mock({
      [testFilename]: 'a'
    });
  });

  afterEach(() => {
    mock.restore();
  });

  describe('constructor', () => {
    it('should construct new instance with valid path', () => {
      let state;
      expect(() => {
        state = new BaseFileState({path: testFilename});
      }).to.not.throw();

      expect(state._path).be.equal(testFilename);
    });

    it('should set custom options as private properties', () => {
      let fooValue = 'bar';
      let barValue = 42;
      let state = new BaseFileState({
        path: testFilename,
        foo: fooValue,
        bar: barValue
      });
      expect(state._foo).be.equal(fooValue);
      expect(state._bar).be.equal(barValue);
    });

    it('should throw error if no options given', () => {
      expect(() => {
        new BaseFileState();
      }).to.throw('Options object with at least a valid "path" is required to create a new file state.');
    });

    it('should throw error if path option is not a string', () => {
      expect(() => {
        new BaseFileState({path: 1});
      }).to.throw('Options object with at least a valid "path" is required to create a new file state.');
    });
  });

  describe('path', () => {
    it('should return path', () => {
      let state = new BaseFileState({path: testFilename});
      expect(state.path).to.be.equal(testFilename);
    });
  });

  describe('isDifferentThan', () => {
    it('should throw error to enforce override', () => {
      expect(() => {
        let state = new BaseFileState({path: testFilename});
        state.isDifferentThan();
      }).to.throw('Override isDifferentThan to determine changes between two file states.');
    });
  });

  describe('toJson', () => {
    it('should throw error to enforce override', () => {
      expect(() => {
        let state = new BaseFileState({path: testFilename});
        state.toJson();
      }).to.throw('Override toJson to return the serializable file state that will be saved to disk.');
    });
  });

});
