import { Octokit } from '@octokit/rest';
import { GitHubRepository, ReactFileStructure } from '../types';
import { FileClassifier } from '../utils/fileClassifier';

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken
    });
  }

  async getUserRepos(): Promise<GitHubRepository[]> {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        affiliation: 'owner,collaborator',
        visibility: 'public'
      });
      
      // Filter to only include public repositories
      const publicRepos = data.filter(repo => !repo.private);
      
      return publicRepos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        html_url: repo.html_url,
        default_branch: repo.default_branch || 'main'
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  async getRepoContent(owner: string, repo: string, path: string = '') {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });
      return data;
    } catch (error) {
      console.error('Error fetching repo content:', error);
      return null;
    }
  }

  async createBranch(owner: string, repo: string, branchName: string, baseBranch: string = 'main') {
    try {
      // Get base branch SHA
      const { data: baseRef } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`
      });

      // Create new branch
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error('Failed to create branch');
    }
  }

  async updateFile(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    message: string, 
    branch: string,
    sha?: string
  ) {
    try {
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha
      });
    } catch (error) {
      console.error('Error updating file:', error);
      throw new Error('Failed to update file');
    }
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    headBranch: string,
    baseBranch: string = 'main'
  ) {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head: headBranch,
        base: baseBranch
      });
      return data;
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw new Error('Failed to create pull request');
    }
  }

  async getFileContent(owner: string, repo: string, path: string, branch?: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });

      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  }

  async findHtmlFiles(owner: string, repo: string, path: string = ''): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      const htmlFiles: string[] = [];

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === 'file' && (item.name.endsWith('.html') || item.name.endsWith('.htm'))) {
            htmlFiles.push(item.path);
          } else if (item.type === 'dir' && !item.name.startsWith('.') && path.split('/').length < 3) {
            // Recursively search directories (limit depth to avoid too many API calls)
            const subFiles = await this.findHtmlFiles(owner, repo, item.path);
            htmlFiles.push(...subFiles);
          }
        }
      }

      return htmlFiles;
    } catch (error) {
      console.error('Error finding HTML files:', error);
      return [];
    }
  }

  async getFileContentWithSha(owner: string, repo: string, path: string, branch?: string): Promise<{ content: string; sha: string } | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });

      if ('content' in data && data.content && data.sha) {
        return {
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
          sha: data.sha
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting file content with SHA:', error);
      return null;
    }
  }

  async findReactFiles(owner: string, repo: string, path: string = ''): Promise<ReactFileStructure> {
    try {
      const allFiles = await this.getAllReactFiles(owner, repo, path);
      
      // Classify files using the FileClassifier
      const classifiedFiles = allFiles.map(filePath => ({
        path: filePath,
        classification: FileClassifier.classifyFile(filePath)
      }));

      // Filter for accessibility-relevant files only
      const relevantFiles = classifiedFiles.filter(file => 
        file.classification.isAccessibilityRelevant
      );

      // Sort by priority (highest first)
      const sortedFiles = relevantFiles.sort((a, b) => 
        b.classification.priority - a.classification.priority
      );

      // Group files by type
      const components = sortedFiles
        .filter(file => file.classification.type === 'component')
        .map(file => file.path);

      const pages = sortedFiles
        .filter(file => file.classification.type === 'page')
        .map(file => file.path);

      const layouts = sortedFiles
        .filter(file => file.classification.type === 'layout')
        .map(file => file.path);

      const otherRelevant = sortedFiles
        .filter(file => !['component', 'page', 'layout'].includes(file.classification.type))
        .map(file => file.path);

      return {
        components,
        pages,
        layouts,
        otherRelevant,
        allFiles: sortedFiles.map(file => file.path)
      };
    } catch (error) {
      console.error('Error finding React files:', error);
      return {
        components: [],
        pages: [],
        layouts: [],
        otherRelevant: [],
        allFiles: []
      };
    }
  }

  async getAllReactFiles(owner: string, repo: string, path: string = ''): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });

      const reactFiles: string[] = [];

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === 'file') {
            // Check if it's a React-related file
            if (this.isReactFile(item.name)) {
              reactFiles.push(item.path);
            }
          } else if (item.type === 'dir' && this.shouldSearchDirectory(item.name, path)) {
            // Recursively search directories (limit depth to avoid too many API calls)
            const subFiles = await this.getAllReactFiles(owner, repo, item.path);
            reactFiles.push(...subFiles);
          }
        }
      }

      return reactFiles;
    } catch (error) {
      console.error('Error getting React files:', error);
      return [];
    }
  }

  async findAllRelevantFiles(owner: string, repo: string): Promise<string[]> {
    const htmlFiles = await this.findHtmlFiles(owner, repo);
    const reactFileStructure = await this.findReactFiles(owner, repo);
    
    // Combine HTML and React files, prioritizing React files
    const allFiles = [
      ...reactFileStructure.allFiles,
      ...htmlFiles.filter(htmlFile => 
        !reactFileStructure.allFiles.includes(htmlFile)
      )
    ];

    // Filter using FileClassifier to ensure only relevant files
    return FileClassifier.filterRelevantFiles(allFiles);
  }

  async detectFramework(owner: string, repo: string): Promise<'html' | 'react' | 'nextjs' | 'mixed'> {
    try {
      // Check for Next.js indicators
      const nextJsIndicators = [
        'next.config.js',
        'next.config.ts',
        'package.json'
      ];

      let hasNextJs = false;
      for (const indicator of nextJsIndicators) {
        const content = await this.getFileContent(owner, repo, indicator);
        if (content) {
          if (indicator === 'package.json') {
            // Check if next is in dependencies
            try {
              const packageJson = JSON.parse(content);
              if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
                hasNextJs = true;
                break;
              }
            } catch {
              // Invalid JSON, continue
            }
          } else {
            hasNextJs = true;
            break;
          }
        }
      }

      if (hasNextJs) return 'nextjs';

      // Check for React files
      const reactFiles = await this.findReactFiles(owner, repo);
      const htmlFiles = await this.findHtmlFiles(owner, repo);

      if (reactFiles.allFiles.length > 0 && htmlFiles.length > 0) {
        return 'mixed';
      } else if (reactFiles.allFiles.length > 0) {
        return 'react';
      } else if (htmlFiles.length > 0) {
        return 'html';
      }

      return 'html'; // Default fallback
    } catch (error) {
      console.error('Error detecting framework:', error);
      return 'html';
    }
  }

  private isReactFile(fileName: string): boolean {
    const reactExtensions = ['.tsx', '.jsx', '.ts', '.js'];
    const hasReactExtension = reactExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasReactExtension) return false;

    // Exclude common non-React files
    const excludePatterns = [
      '.test.',
      '.spec.',
      '.config.',
      '.setup.',
      'webpack.',
      'babel.',
      'eslint.',
      'prettier.',
      'rollup.',
      'vite.',
      'jest.'
    ];

    return !excludePatterns.some(pattern => fileName.includes(pattern));
  }

  private shouldSearchDirectory(dirName: string, currentPath: string): boolean {
    // Exclude common directories that don't contain relevant files
    const excludeDirs = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      'out',
      'coverage',
      '.nyc_output',
      'temp',
      'tmp',
      '.cache',
      '.turbo'
    ];

    if (excludeDirs.includes(dirName)) {
      return false;
    }

    // Limit depth to avoid too many API calls
    const depth = currentPath.split('/').length;
    if (depth > 4) return false;

    // Include important directories
    const importantDirs = [
      'src',
      'components',
      'pages',
      'app',
      'layouts',
      'views',
      'containers',
      'screens'
    ];

    return importantDirs.includes(dirName) || !dirName.startsWith('.');
  }
} 