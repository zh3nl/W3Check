import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { GitHubService } from '../../../../services/github';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - GitHub connection required' },
        { status: 401 }
      );
    }

    const githubService = new GitHubService((session as any).accessToken);
    const repos = await githubService.getUserRepos();

    return NextResponse.json({ repos });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
} 