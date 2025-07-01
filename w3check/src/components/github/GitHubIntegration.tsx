'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { GitHubRepository, ScanResult, PullRequestResult } from '../../types';
import { Github, ExternalLink, Check, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';

interface GitHubIntegrationProps {
  scanResult: ScanResult;
}

export default function GitHubIntegration({ scanResult }: GitHubIntegrationProps) {
  const { data: session, status } = useSession();
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [prResult, setPrResult] = useState<PullRequestResult | null>(null);

  useEffect(() => {
    if (session?.accessToken) {
      fetchRepositories();
    }
  }, [session]);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/github/repos');
      
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const data = await response.json();
      setRepositories(data.repos || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = () => {
    signIn('github');
  };

  const createPullRequest = async () => {
    if (!selectedRepo || !scanResult) return;

    setCreatingPR(true);
    setPrResult(null);

    try {
      const response = await fetch('/api/github/create-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoOwner: selectedRepo.full_name.split('/')[0],
          repoName: selectedRepo.name,
          violations: scanResult.violations,
          scanUrl: scanResult.url,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPrResult(result);
        toast.success(`Pull request created successfully! ${result.fixesApplied} fixes applied.`);
      } else {
        toast.error(result.error || 'Failed to create pull request');
      }
    } catch (error) {
      console.error('Error creating pull request:', error);
      toast.error('Failed to create pull request');
    } finally {
      setCreatingPR(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading GitHub integration...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <Github className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold mb-2">Connect to GitHub</h3>
          <p className="text-gray-600 mb-4">
            Connect your GitHub account to create pull requests with automated accessibility fixes.
          </p>
          <button
            onClick={handleGitHubSignIn}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-4">
        <Github className="w-6 h-6 mr-2" />
        <h3 className="text-lg font-semibold">GitHub Integration</h3>
      </div>

      {prResult ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-medium text-green-800">Pull Request Created Successfully!</h4>
          </div>
          <p className="text-green-700 mt-2">
            {prResult.fixesApplied} accessibility fixes have been applied to your repository.
          </p>
          {prResult.pullRequest && (
            <a
              href={prResult.pullRequest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 text-green-600 hover:text-green-700"
            >
              View Pull Request #{prResult.pullRequest.number}
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
        </div>
      ) : (
        <>
          {/* Repository Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Repository
            </label>
            {loading ? (
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Loading repositories...
              </div>
            ) : repositories.length > 0 ? (
              <select
                value={selectedRepo?.id || ''}
                onChange={(e) => {
                  const repo = repositories.find(r => r.id === parseInt(e.target.value));
                  setSelectedRepo(repo || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a repository...</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.full_name} {repo.private ? '(Private)' : '(Public)'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-yellow-700">No repositories found</span>
              </div>
            )}
          </div>

          {/* Scan Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Scan Results Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">URL:</span>
                <span className="ml-2 font-medium">{scanResult.url}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Violations:</span>
                <span className="ml-2 font-medium">{scanResult.violations.length}</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {scanResult.summary.critical > 0 && (
                <span className="inline-block mr-4">
                  <span className="text-red-600 font-medium">{scanResult.summary.critical}</span> Critical
                </span>
              )}
              {scanResult.summary.serious > 0 && (
                <span className="inline-block mr-4">
                  <span className="text-orange-600 font-medium">{scanResult.summary.serious}</span> Serious
                </span>
              )}
              {scanResult.summary.moderate > 0 && (
                <span className="inline-block mr-4">
                  <span className="text-yellow-600 font-medium">{scanResult.summary.moderate}</span> Moderate
                </span>
              )}
              {scanResult.summary.minor > 0 && (
                <span className="inline-block">
                  <span className="text-blue-600 font-medium">{scanResult.summary.minor}</span> Minor
                </span>
              )}
            </div>
          </div>

          {/* Create PR Button */}
          <button
            onClick={createPullRequest}
            disabled={!selectedRepo || creatingPR || scanResult.violations.length === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {creatingPR ? (
              <span className="flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Creating Pull Request...
              </span>
            ) : (
              'Create Pull Request with Fixes'
            )}
          </button>

          {!selectedRepo && (
            <p className="text-sm text-gray-500 mt-2">
              Please select a repository to create a pull request with accessibility fixes.
            </p>
          )}

          {scanResult.violations.length === 0 && (
            <p className="text-sm text-green-600 mt-2">
              No accessibility violations found - no fixes needed!
            </p>
          )}
        </>
      )}
    </div>
  );
} 