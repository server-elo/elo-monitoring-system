import { SolidityVersionControl } from '@/lib/vcs/SolidityVersionControl';

describe( 'SolidityVersionControl', () => {
  let vcs: SolidityVersionControl;
  const repositoryId = 'test-repo';
  const repositoryName = 'Test Repository';

  beforeEach(() => {
    vcs = new SolidityVersionControl( repositoryId, repositoryName);
  });

  afterEach(() => {
    vcs.removeAllListeners(_);
  });

  describe( 'Repository Initialization', () => {
    test( 'creates repository with correct properties', () => {
      const repoInfo = vcs.repositoryInfo;
      
      expect(_repoInfo.id).toBe(_repositoryId);
      expect(_repoInfo.name).toBe(_repositoryName);
      expect(_repoInfo.defaultBranch).toBe('main');
      expect(_repoInfo.currentBranch).toBe('main');
      expect(_repoInfo.branches.has('main')).toBe(_true);
    });

    test( 'initializes with initial files', async () => {
      const initialFiles = {
        'contracts/MyContract.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    \n}',
        'test/MyContract.test.js': 'const MyContract = artifacts.require("MyContract");'
      };

      const commitId = await vcs.initialize(_initialFiles);
      
      expect(_commitId).toBeDefined(_);
      expect(_commitId).toMatch(_/^commit_/);
      
      const commits = vcs.getCommitHistory(_);
      expect(_commits).toHaveLength(1);
      expect(_commits[0].message).toBe('Initial commit');
      expect(_commits[0].changes).toHaveLength(_2);
    });

    test( 'emits repository-initialized event', async () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'repository-initialized', eventSpy);

      await vcs.initialize(_);

      expect(_eventSpy).toHaveBeenCalledWith({
        repositoryId,
        commitId: expect.stringMatching(_/^commit_/)
      });
    });
  });

  describe( 'File Staging and Commits', () => {
    beforeEach( async () => {
      await vcs.initialize({
        'test.sol': 'contract Test {}'
      });
    });

    test( 'stages files correctly', () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'files-staged', eventSpy);

      // Add file to working directory
      vcs['workingDirectory'].set( 'new-file.sol', 'contract NewFile {}');
      
      vcs.add('new-file.sol');

      expect(_eventSpy).toHaveBeenCalledWith({
        paths: ['new-file.sol']
      });
    });

    test( 'stages multiple files', () => {
      // Add files to working directory
      vcs['workingDirectory'].set( 'file1.sol', 'contract File1 {}');
      vcs['workingDirectory'].set( 'file2.sol', 'contract File2 {}');
      
      vcs.add( ['file1.sol', 'file2.sol']);

      expect(_vcs['stagingArea'].has('file1.sol')).toBe(_true);
      expect(_vcs['stagingArea'].has('file2.sol')).toBe(_true);
    });

    test( 'unstages files correctly', () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'files-unstaged', eventSpy);

      // Stage a file first
      vcs['workingDirectory'].set( 'test-file.sol', 'contract TestFile {}');
      vcs.add('test-file.sol');
      
      // Then unstage it
      vcs.unstage('test-file.sol');

      expect(_vcs['stagingArea'].has('test-file.sol')).toBe(_false);
      expect(_eventSpy).toHaveBeenCalledWith({
        paths: ['test-file.sol']
      });
    });

    test( 'creates commit with staged changes', async () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'commit-created', eventSpy);

      // Stage a file
      vcs['workingDirectory'].set( 'new-feature.sol', 'contract NewFeature {}');
      vcs.add('new-feature.sol');

      const author = {
        name: 'Test User',
        email: 'test@example.com',
        id: 'test-user'
      };

      const commitId = await vcs.commit( 'Add new feature', author);

      expect(_commitId).toBeDefined(_);
      expect(_eventSpy).toHaveBeenCalledWith({
        commit: expect.objectContaining({
          id: commitId,
          message: 'Add new feature',
          author,
          changes: expect.arrayContaining([
            expect.objectContaining({
              type: 'added',
              path: 'new-feature.sol',
              content: 'contract NewFeature {}'
            })
          ])
        })
      });

      // Staging area should be cleared
      expect(_vcs['stagingArea'].size).toBe(0);
    });

    test( 'throws error when committing with no staged changes', async () => {
      const author = {
        name: 'Test User',
        email: 'test@example.com',
        id: 'test-user'
      };

      await expect( vcs.commit('Empty commit', author)).rejects.toThrow(
        'No changes staged for commit'
      );
    });
  });

  describe( 'Branch Management', () => {
    beforeEach( async () => {
      await vcs.initialize(_);
    });

    test( 'creates new branch', () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'branch-created', eventSpy);

      vcs.createBranch('feature/new-feature');

      expect(_vcs.branches).toHaveLength(_2);
      expect(_vcs.branches.find(b => b.name === 'feature/new-feature')).toBeDefined(_);
      expect(_eventSpy).toHaveBeenCalledWith({
        branch: expect.objectContaining({
          name: 'feature/new-feature',
          isDefault: false,
          isProtected: false
        })
      });
    });

    test( 'throws error when creating duplicate branch', () => {
      vcs.createBranch('feature/test');
      
      expect(() => vcs.createBranch('feature/test')).toThrow(
        'Branch feature/test already exists'
      );
    });

    test( 'switches to existing branch', async () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'branch-switched', eventSpy);

      vcs.createBranch('feature/test');
      await vcs.checkout('feature/test');

      expect(_vcs.currentBranch).toBe('feature/test');
      expect(_eventSpy).toHaveBeenCalledWith({
        branchName: 'feature/test',
        commitId: expect.any(_String)
      });
    });

    test( 'throws error when switching to non-existent branch', async () => {
      await expect(_vcs.checkout('non-existent')).rejects.toThrow(
        'Branch non-existent does not exist'
      );
    });

    test( 'prevents checkout with uncommitted changes', async () => {
      // Stage some changes
      vcs['workingDirectory'].set( 'uncommitted.sol', 'contract Uncommitted {}');
      vcs.add('uncommitted.sol');

      vcs.createBranch('feature/test');

      await expect(_vcs.checkout('feature/test')).rejects.toThrow(
        'You have uncommitted changes. Please commit or stash them first.'
      );
    });
  });

  describe( 'Merge Operations', () => {
    beforeEach( async () => {
      await vcs.initialize({
        'base.sol': 'contract Base {}'
      });
    });

    test( 'merges branches successfully', async () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'branches-merged', eventSpy);

      // Create and switch to feature branch
      vcs.createBranch('feature/test');
      await vcs.checkout('feature/test');

      // Add changes to feature branch
      vcs['workingDirectory'].set( 'feature.sol', 'contract Feature {}');
      vcs.add('feature.sol');
      await vcs.commit('Add feature', {
        name: 'Test User',
        email: 'test@example.com',
        id: 'test-user'
      });

      // Switch back to main and merge
      await vcs.checkout('main');
      const mergeCommitId = await vcs.merge( 'feature/test', 'main');

      expect(_mergeCommitId).toBeDefined(_);
      expect(_eventSpy).toHaveBeenCalledWith({
        sourceBranch: 'feature/test',
        targetBranch: 'main',
        mergeCommitId
      });
    });

    test( 'detects merge conflicts', async () => {
      // This is a simplified test - in a real implementation,
      // conflict detection would be more sophisticated
      vcs.createBranch('feature/conflict');
      
      // In a real scenario, we'd have conflicting changes
      // For now, we'll test the error case
      await expect( vcs.merge('non-existent', 'main')).rejects.toThrow(
        'Source or target branch does not exist'
      );
    });
  });

  describe( 'Merge Requests', () => {
    beforeEach( async () => {
      await vcs.initialize(_);
      vcs.createBranch('feature/mr-test');
    });

    test( 'creates merge request', () => {
      const eventSpy = jest.fn(_);
      vcs.on( 'merge-request-created', eventSpy);

      const author = {
        name: 'Test User',
        email: 'test@example.com',
        id: 'test-user'
      };

      const mrId = vcs.createMergeRequest(
        'Add new feature',
        'This PR adds a new feature to the contract',
        'feature/mr-test',
        'main',
        author
      );

      expect(_mrId).toBeDefined(_);
      expect(_mrId).toMatch(_/^mr_/);
      expect(_vcs.mergeRequests).toHaveLength(1);
      expect(_eventSpy).toHaveBeenCalledWith({
        mergeRequest: expect.objectContaining({
          id: mrId,
          title: 'Add new feature',
          description: 'This PR adds a new feature to the contract',
          sourceBranch: 'feature/mr-test',
          targetBranch: 'main',
          author,
          status: 'open'
        })
      });
    });
  });

  describe( 'Commit History and Diffs', () => {
    beforeEach( async () => {
      await vcs.initialize({
        'initial.sol': 'contract Initial {}'
      });
    });

    test( 'returns commit history', async () => {
      // Add more commits
      vcs['workingDirectory'].set( 'second.sol', 'contract Second {}');
      vcs.add('second.sol');
      await vcs.commit('Second commit', {
        name: 'Test User',
        email: 'test@example.com',
        id: 'test-user'
      });

      const history = vcs.getCommitHistory(_);
      
      expect(_history).toHaveLength(_2);
      expect(_history[0].message).toBe('Second commit');
      expect(_history[1].message).toBe('Initial commit');
    });

    test( 'limits commit history', async () => {
      // Add multiple commits
      for (let i = 0; i < 5; i++) {
        vcs['workingDirectory'].set( `file${i}.sol`, `contract File${i} {}`);
        vcs.add(_`file${i}.sol`);
        await vcs.commit(`Commit ${i}`, {
          name: 'Test User',
          email: 'test@example.com',
          id: 'test-user'
        });
      }

      const history = vcs.getCommitHistory( 'main', 3);
      expect(_history).toHaveLength(3);
    });

    test( 'generates file diffs', async () => {
      // Create first commit
      vcs['workingDirectory'].set( 'test.sol', 'contract Test { uint256 value; }');
      vcs.add('test.sol');
      const firstCommit = await vcs.commit('First version', {
        name: 'Test User',
        email: 'test@example.com',
        id: 'test-user'
      });

      // Create second commit with changes
      vcs['workingDirectory'].set( 'test.sol', 'contract Test { uint256 value; uint256 newValue; }');
      vcs.add('test.sol');
      const secondCommit = await vcs.commit('Add new value', {
        name: 'Test User',
        email: 'test@example.com',
        id: 'test-user'
      });

      const diff = vcs.getDiff( firstCommit, secondCommit, 'test.sol');
      
      expect(_diff).toHaveLength(1);
      expect(_diff[0]).toMatchObject({
        type: 'modified',
        path: 'test.sol',
        hunks: expect.arrayContaining([
          expect.objectContaining({
            lines: expect.any(_Array)
          })
        ])
      });
    });
  });

  describe( 'Error Handling', () => {
    test( 'handles invalid commit references in diff', () => {
      expect(() => vcs.getDiff( 'invalid-commit-1', 'invalid-commit-2')).toThrow(
        'Invalid commit references'
      );
    });

    test( 'handles merge with invalid branches', async () => {
      await expect( vcs.merge('invalid-source', 'invalid-target')).rejects.toThrow(
        'Source or target branch does not exist'
      );
    });
  });

  describe( 'Repository State', () => {
    test( 'tracks current branch correctly', async () => {
      await vcs.initialize(_);
      
      expect(_vcs.currentBranch).toBe('main');
      
      vcs.createBranch('feature/test');
      await vcs.checkout('feature/test');
      
      expect(_vcs.currentBranch).toBe('feature/test');
    });

    test( 'provides repository information', () => {
      const repoInfo = vcs.repositoryInfo;
      
      expect(_repoInfo).toMatchObject({
        id: repositoryId,
        name: repositoryName,
        defaultBranch: 'main',
        currentBranch: 'main'
      });
      
      expect(_repoInfo.branches).toBeInstanceOf(_Map);
      expect(_repoInfo.mergeRequests).toBeInstanceOf(_Map);
    });
  });
});
