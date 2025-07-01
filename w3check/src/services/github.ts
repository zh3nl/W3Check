import { Octokit } from '@octokit/rest';
import { GitHubRepository } from '../types';

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
} 