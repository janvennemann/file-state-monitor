import { expect } from 'chai';
import fs from 'fs';
import mock from 'mock-fs';
import sinon from 'sinon';
import { FileMonitor, BaseFileState } from '../lib/index';

describe('FileMonitor', () => {
  let files = {
    stateFilename: 'state.json',
    corruptedStateFilename: 'corruptedState.json',
    emptyTestFilename: 'empty.data',
    testDirectory: 'testDir'
  };
  let monitor;
  class MockState extends BaseFileState {
    isDifferentThan() {

    }
    toJson() {
      return {
        path: this.path
      };
    }
  }

  beforeEach(() => {
    monitor = new FileMonitor(MockState);
    mock({
      [files.stateFilename]: JSON.stringify({
        files: [{
          path: files.emptyTestFilename
        }]
      }),
      [files.corruptedStateFilename]: '{{',
      [files.emptyTestFilename]: '',
      [files.testDirectory]: {
        'file1.data': '',
        'file2.data': '',
        'subdir': {
          'file3.data': ''
        }
      }
    });
  });

  afterEach(() => {
    monitor = null;
    mock.restore();
  });

  describe('constructor', () => {
    it('should throw error if no valid change detection strategy is given', () => {
      let errorMessage = 'You need to provide a valid file state class which extends BaseFileState';
      expect(() => {
        new FileMonitor();
      }).to.throw(TypeError, errorMessage);

      expect(() => {
        new FileMonitor(null);
      }).to.throw(TypeError, errorMessage);

      expect(() => {
        new FileMonitor({});
      }).to.throw(TypeError, errorMessage);
    });

    it('should construct with empty maps and file state class', () => {
      expect(monitor._loadedFiles).to.be.an.instanceof(Map);
      expect(monitor._processedFiles).to.be.an.instanceof(Map);
      expect(monitor._changedFiles).to.be.an.instanceof(Map);
      expect(monitor._fileStateClass.prototype).to.be.an.instanceof(BaseFileState);
    });
  });

  describe('constants', () => {
    it('should return FILE_STATUS_* constant values', () => {
      expect(FileMonitor.FILE_STATUS_CREATED).to.be.equal('created');
      expect(FileMonitor.FILE_STATUS_CHANGED).to.be.equal('changed');
      expect(FileMonitor.FILE_STATUS_DELETED).to.be.equal('deleted');
    });
  });

  describe('load', () => {
    it('should return false if state file does not exists', () => {
      expect(monitor.load('/does/not/exist')).to.be.false;
    });

    it('should populate loaded files from state file', () => {
      let loaded = monitor.load(files.stateFilename);
      expect(loaded).to.be.true;
      expect(monitor._loadedFiles.size).to.be.equal(1);
      expect(monitor._loadedFiles).to.have.key(files.emptyTestFilename);
    });

    it('should return false on corrupted state data', () => {
      let loaded = monitor.load(files.corruptedStateFilename);
      expect(loaded).to.be.false;
    });
  });

  describe('write', () => {
    it('should write the processes file states to disk', () => {
      monitor._processedFiles.set(files.emptyTestFilename, new MockState({path: files.emptyTestFilename}));
      monitor.write(files.stateFilename);
      expect(fs.readFileSync(files.stateFilename).toString()).to.be.equal('{"files":[{"path":"' + files.emptyTestFilename + '"}]}');
    });
  });

  describe('monitorPath', () => {
    it('should skip non-existing paths', () => {
      sinon.spy(monitor, 'updateFileState');
      monitor.monitorPath();
      expect(monitor.updateFileState.notCalled).to.be.true;
    });

    it('should call updateFileState for single file', () => {
      sinon.spy(monitor, 'updateFileState');
      monitor.monitorPath(files.emptyTestFilename);
      expect(monitor.updateFileState.calledWith(files.emptyTestFilename));
    });

    it('should call updateFileState for all files in a directory', () => {
      sinon.spy(monitor, 'updateFileState');
      monitor.monitorPath(files.testDirectory);
      expect(monitor.updateFileState.firstCall.calledWith('testDir/file1.data')).to.be.true;
      expect(monitor.updateFileState.secondCall.calledWith('testDir/file2.data')).to.be.true;
      expect(monitor.updateFileState.thirdCall.calledWith('testDir/subdir/file3.data')).to.be.true;
    });
  });

  describe('updateFileState', () => {
    it('should update state maps for new file', () => {
      monitor.updateFileState(files.emptyTestFilename);
      expect(monitor._changedFiles.size).to.be.equal(1);
      expect(monitor._changedFiles).to.have.key(files.emptyTestFilename);
      expect(monitor._changedFiles.get(files.emptyTestFilename)).to.be.equal(FileMonitor.FILE_STATUS_CREATED);
      expect(monitor._processedFiles.size).to.be.equal(1);
      expect(monitor._processedFiles).to.have.key(files.emptyTestFilename);
      expect(monitor._processedFiles.get(files.emptyTestFilename)).to.be.instanceof(MockState);
    });

    it('should update state maps for changed file', () => {
      let isDifferentThanStub = sinon.stub(MockState.prototype, 'isDifferentThan');
      isDifferentThanStub.returns(true);
      let loaded = monitor.load(files.stateFilename);
      expect(loaded).to.be.true;
      fs.writeFileSync(files.emptyTestFilename, 'test');
      monitor.updateFileState(files.emptyTestFilename);
      expect(isDifferentThanStub.called).to.be.true;
      expect(monitor._changedFiles.size).to.be.equal(1);
      expect(monitor._changedFiles).to.have.key(files.emptyTestFilename);
      expect(monitor._changedFiles.get(files.emptyTestFilename)).to.be.equal(FileMonitor.FILE_STATUS_CHANGED);
      expect(monitor._processedFiles.size).to.be.equal(1);
      expect(monitor._processedFiles).to.have.key(files.emptyTestFilename);
      expect(monitor._processedFiles.get(files.emptyTestFilename)).to.be.instanceof(MockState);
      MockState.prototype.isDifferentThan.restore();
    });

    it('should update state maps for unchanged file', () => {
      let isDifferentThanStub = sinon.stub(MockState.prototype, 'isDifferentThan');
      isDifferentThanStub.returns(false);
      let loaded = monitor.load(files.stateFilename);
      expect(loaded).to.be.true;
      fs.writeFileSync(files.emptyTestFilename, 'test');
      monitor.updateFileState(files.emptyTestFilename);
      expect(isDifferentThanStub.called).to.be.true;
      expect(monitor._changedFiles.size).to.be.equal(0);
      expect(monitor._processedFiles.size).to.be.equal(1);
      expect(monitor._processedFiles).to.have.key(files.emptyTestFilename);
      expect(monitor._processedFiles.get(files.emptyTestFilename)).to.be.instanceof(MockState);
      MockState.prototype.isDifferentThan.restore();
    });
  });

  describe('update', () => {
    it('should throw error if path is not an array', () => {
      expect(() => {
        monitor.update();
      }).to.throw(TypeError, 'The file monitor needs to be updated with an array of paths.');

      expect(() => {
        monitor.update('single/path');
      }).to.throw(TypeError, 'The file monitor needs to be updated with an array of paths.');

      expect(() => {
        monitor.update({});
      }).to.throw(TypeError, 'The file monitor needs to be updated with an array of paths.');
    });

    it('should reset monitor with new files', () => {
      sinon.spy(monitor, 'monitorPath');
      monitor._processedFiles.set('old.file', new MockState({path: 'old.file'}));
      monitor.update([files.testDirectory]);
      expect(monitor._loadedFiles.size).to.be.equal(1);
      expect(monitor._processedFiles.size).to.be.equal(3);
      expect(monitor._changedFiles.size).to.be.equal(3);
      expect(monitor.monitorPath.calledWith(files.testDirectory)).to.be.true;
    });
  });

  describe('getChangedFiles', () => {
    it('should get created, changed and deleted files', () => {
      let createdFile = 'created.data';
      let changedFile = 'changed.data';
      let deletedFile = 'deleted.data';

      monitor._loadedFiles.set(deletedFile, new MockState({path: deletedFile}));
      monitor._changedFiles.set(createdFile, FileMonitor.FILE_STATUS_CREATED);
      monitor._changedFiles.set(changedFile, FileMonitor.FILE_STATUS_CHANGED);
      let changedFiles = monitor.getChangedFiles();
      expect(changedFiles.size).to.be.equal(3);
      expect(changedFiles).to.have.keys([createdFile, changedFile, deletedFile]);
      expect(changedFiles.get(createdFile)).to.be.equal(FileMonitor.FILE_STATUS_CREATED);
      expect(changedFiles.get(changedFile)).to.be.equal(FileMonitor.FILE_STATUS_CHANGED);
      expect(changedFiles.get(deletedFile)).to.be.equal(FileMonitor.FILE_STATUS_DELETED);
    });
  });
});
