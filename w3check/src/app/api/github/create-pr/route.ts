import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { GitHubService } from '../../../../services/github';
import { AccessibilityFixer } from '../../../../services/accessibilityFixer';
import { FileClassifier } from '../../../../utils/fileClassifier';
import { ReactFile, JSXCodeFix, CodeFix } from '../../../../types';

interface SessionWithToken {
  accessToken: string;
}

interface ViolationData {
  id: string;
  impact: string;
  nodes?: Array<{ html?: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const sessionWithToken = session as SessionWithToken;
    if (!session || !sessionWithToken.accessToken) {
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
    console.log('Violation details:', violations.map((v: ViolationData) => ({
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

    const githubService = new GitHubService(sessionWithToken.accessToken);
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

    // Detect repository framework
    const framework = await githubService.detectFramework(repoOwner, repoName);
    console.log('Detected framework:', framework);

    // Create a helper function for getting file content
    const getFileContent = async (path: string) => {
      return await githubService.getFileContent(repoOwner, repoName, path);
    };

    // eslint-disable-next-line prefer-const
    let allFixes: (CodeFix | JSXCodeFix)[] = [];
    // eslint-disable-next-line prefer-const
    let appliedFixes: string[] = [];

    // Process React/Next.js files if present
    if (framework === 'react' || framework === 'nextjs' || framework === 'mixed') {
      console.log('Processing React/Next.js files...');
      
      const reactFileStructure = await githubService.findReactFiles(repoOwner, repoName);
      console.log('React files found:', {
        components: reactFileStructure.components.length,
        pages: reactFileStructure.pages.length,
        layouts: reactFileStructure.layouts.length,
        total: reactFileStructure.allFiles.length
      });

      if (reactFileStructure.allFiles.length > 0) {
        // Convert file paths to ReactFile objects with metadata
        const reactFiles: ReactFile[] = reactFileStructure.allFiles.map(filePath => {
          const classification = FileClassifier.classifyFile(filePath);
          return {
            path: filePath,
            type: classification.type as 'component' | 'page' | 'layout' | 'other',
            framework: classification.framework as 'react' | 'nextjs',
            priority: classification.priority,
            language: classification.language as 'tsx' | 'jsx' | 'ts' | 'js'
          };
        });

        // Apply React-specific fixes
        try {
          const reactFixes = await accessibilityFixer.findAndApplyReactFixes(
            violations, 
            scanUrl, 
            reactFiles, 
            getFileContent
          );
          
          console.log('React fixes generated:', reactFixes.length);
          allFixes.push(...reactFixes);
        } catch (error) {
          console.error('Error applying React fixes:', error);
        }
      }
    }

    // Process HTML files (for HTML-only repos or as fallback for mixed repos)
    if (framework === 'html' || framework === 'mixed' || allFixes.length === 0) {
      console.log('Processing HTML files...');
      
      const htmlFiles = await githubService.findHtmlFiles(repoOwner, repoName);
      console.log('HTML files found:', htmlFiles.length);
      
      if (htmlFiles.length > 0) {
        try {
          const htmlFixes = await accessibilityFixer.findAndApplyFixes(
            violations, 
            scanUrl, 
            htmlFiles, 
            getFileContent
          );
          
          console.log('HTML fixes generated:', htmlFixes.length);
          allFixes.push(...htmlFixes);
        } catch (error) {
          console.error('Error applying HTML fixes:', error);
        }
      }
    }

    // Debug: Log all fix generation results
    console.log('Total fixes generated:', allFixes.length);
    console.log('Fix details:', allFixes.map(fix => ({
      filePath: fix.filePath,
      description: fix.description,
      violationsFixed: fix.violationsFixed,
      isReactFix: 'jsxTransform' in fix ? fix.jsxTransform : false,
      originalContentLength: fix.originalContent.length,
      fixedContentLength: fix.fixedContent.length
    })));

    if (allFixes.length === 0) {
      console.log('ERROR: No matching content found in repository files');
      console.log('Repository framework:', framework);
      console.log('This could mean:');
      console.log('1. The violations are from dynamic content not present in source files');
      console.log('2. The HTML content in violations does not match repository files');
      console.log('3. Complex component hierarchies that need manual review');
      
      return NextResponse.json(
        { error: `No matching content found in ${framework} repository. The violations may be from dynamic content or require manual review.` },
        { status: 400 }
      );
    }

    // Apply fixes to files
    for (const fix of allFixes) {
      try {
        // Get current file content with SHA for proper updates
        const fileData = await githubService.getFileContentWithSha(
          repoOwner, 
          repoName, 
          fix.filePath
        );

        if (fileData) {
          const commitMessage = 'jsxTransform' in fix && fix.jsxTransform 
            ? `Fix React accessibility: ${fix.description}`
            : `Fix accessibility: ${fix.description}`;

          await githubService.updateFile(
            repoOwner,
            repoName,
            fix.filePath,
            fix.fixedContent,
            commitMessage,
            branchName,
            fileData.sha
          );

          appliedFixes.push(fix.description);
          console.log(`✓ Applied fix to ${fix.filePath}: ${fix.description}`);
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

    // Group fixes by type for better PR description
    const reactFixCount = allFixes.filter(fix => 'jsxTransform' in fix && fix.jsxTransform).length;
    const htmlFixCount = allFixes.length - reactFixCount;

    // Create pull request with enhanced description
    const prTitle = `Accessibility Improvements for ${scanUrl}`;
    const prBody = `
## Accessibility Fixes Applied

This pull request contains automated fixes for accessibility violations found during a scan of ${scanUrl}.

### Repository Framework: ${framework.toUpperCase()}

### Fixes Applied:
${appliedFixes.map(fix => `- ${fix}`).join('\n')}

### Fix Summary:
- **React/JSX Fixes**: ${reactFixCount}
- **HTML Fixes**: ${htmlFixCount}
- **Total Violations Fixed**: ${appliedFixes.length}

### Details:
- **Scan URL**: ${scanUrl}
- **Repository Type**: ${framework}
- **Generated by**: W3Check Accessibility Scanner

### Review Notes:
Please review these changes carefully and test them in your application before merging. 

${framework === 'react' || framework === 'nextjs' ? 
`**React/Next.js Specific Notes:**
- JSX props have been added/modified for accessibility
- Component accessibility patterns have been applied
- Ensure these changes work with your component logic and styling` : ''}

${framework === 'mixed' ? 
`**Mixed Repository Notes:**
- Both React/JSX and HTML files have been updated
- Ensure consistency between React components and static HTML` : ''}

While these fixes address common accessibility issues, they may need customization to fit your specific design and functionality requirements.

### Additional Resources:
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
${framework === 'react' || framework === 'nextjs' || framework === 'mixed' ? 
`- [React Accessibility Documentation](https://react.dev/reference/react-dom/components#accessibility)` : ''}
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
        fixes: appliedFixes,
        framework,
        fixSummary: {
          reactFixes: reactFixCount,
          htmlFixes: htmlFixCount,
          total: appliedFixes.length
        }
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