# GitHub Integration Setup Guide

This guide will help you set up the GitHub integration feature for W3Check, which allows users to create pull requests with automated accessibility fixes.

## Prerequisites

1. A GitHub account
2. Next.js application running locally
3. Node.js and npm installed

## Step 1: Create GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: W3Check (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Note down the **Client ID** and **Client Secret**

## Step 2: Install Dependencies

Run the following command to install the required packages:

```bash
npm install @octokit/rest next-auth
```

## Step 3: Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Existing Supabase and AI configurations...
```

To generate a secure `NEXTAUTH_SECRET`, you can use:
```bash
openssl rand -base64 32
```

## Step 4: Update GitHub OAuth App for Production

When deploying to production:

1. Update the GitHub OAuth App settings:
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`
2. Update the `NEXTAUTH_URL` environment variable to your production URL

## Features

The GitHub integration provides:

1. **OAuth Authentication**: Users can connect their GitHub accounts
2. **Repository Access**: View and select from user's repositories
3. **Automated Fix Generation**: Generate code fixes for accessibility violations
4. **Pull Request Creation**: Create branches and pull requests with fixes
5. **Comprehensive PR Descriptions**: Include scan details and fix summaries

## How It Works

1. Users scan a website for accessibility issues
2. On the results page, they can connect their GitHub account
3. Select a repository from their GitHub account
4. The system generates code fixes for detected violations
5. Creates a new branch with the fixes applied
6. Opens a pull request with detailed descriptions

## Code Fix Types

The system can generate fixes for:

- **Missing Alt Text**: Adds descriptive alt attributes to images
- **Color Contrast**: Suggests CSS improvements for better contrast
- **Missing Labels**: Adds proper labels for form inputs
- **Heading Order**: Fixes heading hierarchy issues
- **Missing Landmarks**: Adds main, section, and other ARIA landmarks
- **Generic Issues**: Adds comments with links to WCAG guidelines

## Security Considerations

1. **Permissions**: The app requests `public_repo`, `read:user`, and `user:email` scopes (public repositories only)
2. **Token Storage**: Access tokens are stored in the user's session
3. **Repository Access**: Users can only create PRs in their public repositories they have write access to
4. **Content Safety**: Generated fixes are basic and should be reviewed before merging
5. **Public Repositories Only**: For development purposes, only public repositories are accessible

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**: 
   - Check GitHub OAuth app credentials
   - Verify callback URL matches exactly

2. **"Failed to create branch"**: 
   - Ensure user has write access to the repository
   - Check if branch name already exists

3. **"No fixes could be applied"**: 
   - Files may not exist in the repository
   - URL structure may not match repository file structure

### Development Tips

1. Use the GitHub OAuth app's "Device Flow" option if testing CLI tools
2. For web applications, use the standard Authorization Code flow (default)
3. Test with both public and private repositories
4. Verify CORS settings if running into browser issues

## Example Usage

1. Run a scan: `https://example.com`
2. View results page
3. Click "Connect GitHub" in the GitHub Integration section
4. Authorize the application
5. Select target repository
6. Click "Create Pull Request with Fixes"
7. Review the generated pull request on GitHub

## Next Steps

- Test the integration with various types of repositories
- Customize fix generation logic for your specific needs
- Add more sophisticated fix patterns
- Implement additional WCAG guidelines coverage 