import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { GitHubService } from '../../../../services/github';
import { AccessibilityFixer } from '../../../../services/accessibilityFixer';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - GitHub connection required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { repoOwner, repoName, violations, scanUrl } = body;

    // Debug: Log received data
    console.log('=== CREATE PR DEBUG ===');
    console.log('Repository:', `${repoOwner}/${repoName}`);
    console.log('Scan URL:', scanUrl);
    console.log('Violations received:', violations.length);
    console.log('Violation details:', violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      nodeCount: v.nodes?.length || 0,
      firstNodeHtml: v.nodes?.[0]?.html?.substring(0, 100) + '...'
    })));

    if (!repoOwner || !repoName || !violations || !scanUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const githubService = new GitHubService((session as any).accessToken);
    const accessibilityFixer = new AccessibilityFixer();

    // Create a new branch
    const branchName = `accessibility-fixes-${Date.now()}`;
    
    try {
      await githubService.createBranch(repoOwner, repoName, branchName);
    } catch (error) {
      console.error('Error creating branch:', error);
      return NextResponse.json(
        { error: 'Failed to create branch. Check repository permissions.' },
        { status: 403 }
      );
    }

    // Find HTML files in the repository
    const htmlFiles = await githubService.findHtmlFiles(repoOwner, repoName);
    
    // Debug: Log found HTML files
    console.log('HTML files found in repository:', htmlFiles);
    console.log('HTML files count:', htmlFiles.length);
    
    if (htmlFiles.length === 0) {
      console.log('ERROR: No HTML files found in repository');
      return NextResponse.json(
        { error: 'No HTML files found in repository' },
        { status: 400 }
      );
    }

    // Create a helper function for getting file content
    const getFileContent = async (path: string) => {
      return await githubService.getFileContent(repoOwner, repoName, path);
    };

    // Find and apply fixes using smart content matching
    const fixes = await accessibilityFixer.findAndApplyFixes(violations, scanUrl, htmlFiles, getFileContent);

    // Debug: Log fix generation results
    console.log('Fixes generated:', fixes.length);
    console.log('Fix details:', fixes.map(fix => ({
      filePath: fix.filePath,
      description: fix.description,
      violationsFixed: fix.violationsFixed,
      originalContentLength: fix.originalContent.length,
      fixedContentLength: fix.fixedContent.length
    })));

    if (fixes.length === 0) {
      console.log('ERROR: No matching content found in repository files');
      console.log('This could mean:');
      console.log('1. The HTML content in violations does not match repository files');
      console.log('2. The violations are from dynamic content');
      console.log('3. Different file structure between scan and repository');
      return NextResponse.json(
        { error: 'No matching content found in repository files. The violations may be from dynamic content or different file structure.' },
        { status: 400 }
      );
    }

    // Apply fixes to files
    const appliedFixes: string[] = [];
    
    for (const fix of fixes) {
      try {
        // Get current file content with SHA for proper updates
        const fileData = await githubService.getFileContentWithSha(
          repoOwner, 
          repoName, 
          fix.filePath
        );

        if (fileData) {
          await githubService.updateFile(
            repoOwner,
            repoName,
            fix.filePath,
            fix.fixedContent,
            `Fix accessibility: ${fix.description}`,
            branchName,
            fileData.sha
          );

          appliedFixes.push(fix.description);
        }
      } catch (error) {
        console.error(`Error applying fix to ${fix.filePath}:`, error);
      }
    }

    if (appliedFixes.length === 0) {
      return NextResponse.json(
        { error: 'No fixes could be applied. Files may not exist or be accessible.' },
        { status: 400 }
      );
    }

    // Create pull request
    const prTitle = `Accessibility Improvements for ${scanUrl}`;
    const prBody = `
## Accessibility Fixes Applied

This pull request contains automated fixes for accessibility violations found during a scan of ${scanUrl}.

### Fixes Applied:
${appliedFixes.map(fix => `- ${fix}`).join('\n')}

### Details:
- **Scan URL**: ${scanUrl}
- **Violations Fixed**: ${appliedFixes.length}
- **Generated by**: W3Check Accessibility Scanner

### Review Notes:
Please review these changes carefully and test them in your application before merging. While these fixes address common accessibility issues, they may need customization to fit your specific design and functionality requirements.

### Additional Resources:
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
`;

    try {
      const pullRequest = await githubService.createPullRequest(
        repoOwner,
        repoName,
        prTitle,
        prBody,
        branchName
      );

      return NextResponse.json({
        success: true,
        pullRequest: {
          url: pullRequest.html_url,
          number: pullRequest.number
        },
        fixesApplied: appliedFixes.length,
        fixes: appliedFixes
      });
    } catch (error) {
      console.error('Error creating pull request:', error);
      return NextResponse.json(
        { error: 'Failed to create pull request' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in create-pr API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 