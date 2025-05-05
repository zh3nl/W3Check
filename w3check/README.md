# WCAG Compliance Scanner

An AI-powered web accessibility checker that scans websites for WCAG 2.0 (AA) compliance issues and provides actionable solutions.

## Features

- URL processor for single and batch website scanning
- Puppeteer-based crawling engine with JavaScript rendering
- Automated WCAG 2.0 (AA) compliance checks using Axe-core
- AI enhancement layer for context-aware accessibility fixes
- Comprehensive reporting with violation details and suggested fixes

## Tech Stack

- **Frontend**: Next.js, TailwindCSS, React Hook Form
- **Backend**: Node.js, Next.js API Routes
- **Testing**: Puppeteer, Axe-core
- **AI**: OpenAI API for enhancement suggestions

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key (optional - for AI-powered fixes)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/compliance-ai.git
   cd compliance-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file with the following:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Enter a website URL in the input field
2. Select crawl depth (1-10) for multi-page scanning
3. Toggle batch mode for testing multiple URLs at once
4. View detailed compliance reports with:
   - Violation counts by severity
   - Affected HTML elements
   - WCAG criteria information
   - AI-generated fix suggestions

## Accessibility Issues Detected

The scanner checks for numerous WCAG 2.0 (AA) compliance issues, including:

- Color contrast problems
- Missing alternative text for images
- Improper heading structure
- Missing form labels
- Keyboard navigation issues
- ARIA attribute errors
- And many more...

## Rate Limiting

To prevent overloading target websites, the scanner includes:
- 10 requests per minute rate limiting per IP address
- Configurable crawl depth limit (max 10 for single URLs, max 5 for batch mode)
- Maximum 50 URLs in batch mode

## Production Deployment

For production environments:
1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Axe-core](https://github.com/dequelabs/axe-core) for accessibility testing
- [Puppeteer](https://pptr.dev/) for headless browser testing
- [OpenAI](https://openai.com/) for AI-powered fix suggestions
