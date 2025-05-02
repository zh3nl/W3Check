import puppeteer, { Browser, Page } from 'puppeteer';
import AxeBuilder from '@axe-core/puppeteer';
import { analyzeAccessibilityViolations } from './ai-analyzer';
import { ScanResult, ViolationType } from '../types';

// Cache the browser instance to improve performance
let browserInstance: Browser | null = null;

// Get or create a browser instance
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true, // Use true instead of 'new' for compatibility
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

// Initialize a new page with necessary settings
async function initPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  
  // Add timeout for navigation
  page.setDefaultNavigationTimeout(30000);
  
  return page;
}

// Run accessibility scan on a single page
async function scanPage(url: string, maxDepth: number = 1): Promise<ScanResult> {
  const browser = await getBrowser();
  const page = await initPage(browser);
  let violations: ViolationType[] = [];
  let passes = 0;
  let incomplete = 0;
  let inapplicable = 0;
  let status: 'completed' | 'failed' = 'completed';
  let pageContent = '';
  
  try {
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Get page content for AI analysis
    pageContent = await page.content();
    
    // Run axe-core analysis
    const axeResults = await new AxeBuilder(page)
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Process results - map axe violations to our format
    const rawViolations = axeResults.violations.map((violation) => {
      return {
        id: violation.id,
        impact: (violation.impact as 'critical' | 'serious' | 'moderate' | 'minor'),
        description: violation.description,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node) => ({
          html: node.html,
          // Ensure target is converted to string array if it's not already
          target: Array.isArray(node.target) 
            ? node.target.map(String) 
            : [String(node.target)],
          failureSummary: node.failureSummary || '',
        })),
        tags: violation.tags
      } as ViolationType;
    });
    
    // Use AI analyzer to enhance violations with detailed explanations and fixes
    violations = await analyzeAccessibilityViolations(rawViolations, url, pageContent);
    
    passes = axeResults.passes.length;
    incomplete = axeResults.incomplete.length;
    inapplicable = axeResults.inapplicable.length;
    
  } catch (error) {
    console.error(`Error scanning ${url}:`, error);
    status = 'failed';
  } finally {
    await page.close();
  }
  
  // Calculate summary statistics
  const summary = {
    critical: violations.filter(v => v.impact === 'critical').length,
    serious: violations.filter(v => v.impact === 'serious').length,
    moderate: violations.filter(v => v.impact === 'moderate').length,
    minor: violations.filter(v => v.impact === 'minor').length,
    total: violations.length
  };
  
  // Return scan result
  return {
    id: Date.now().toString(),
    url,
    timestamp: new Date().toISOString(),
    status,
    violations,
    passes,
    incomplete,
    inapplicable,
    summary
  };
}

// Scan a single URL with specified crawl depth
export async function scanSingleUrl(
  url: string, 
  maxDepth: number = 1,
  scanId: string
): Promise<ScanResult> {
  try {
    // Use maxDepth for crawling behavior (even though we're not implementing crawling yet)
    const result = await scanPage(url, maxDepth);
    result.id = scanId;
    return result;
  } catch (error) {
    console.error(`Error in scanSingleUrl for ${url}:`, error);
    
    // Return a failed scan result
    return {
      id: scanId,
      url,
      timestamp: new Date().toISOString(),
      status: 'failed',
      violations: [],
      passes: 0,
      incomplete: 0,
      inapplicable: 0,
      summary: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
        total: 0
      }
    };
  }
}

// Scan multiple URLs in batch mode
export async function scanBatchUrls(
  urls: string[], 
  maxDepth: number = 1,
  scanId: string
): Promise<ScanResult[]> {
  try {
    // Use maxDepth for crawling behavior (even though we're not implementing crawling yet)
    const results: ScanResult[] = [];
    
    for (const url of urls) {
      try {
        const result = await scanPage(url, maxDepth);
        result.id = `${scanId}-${results.length}`;
        results.push(result);
      } catch (error) {
        console.error(`Error scanning batch URL ${url}:`, error);
        
        // Add a failed result for this URL
        results.push({
          id: `${scanId}-${results.length}`,
          url,
          timestamp: new Date().toISOString(),
          status: 'failed',
          violations: [],
          passes: 0,
          incomplete: 0,
          inapplicable: 0,
          summary: {
            critical: 0,
            serious: 0,
            moderate: 0,
            minor: 0,
            total: 0
          }
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in scanBatchUrls:', error);
    throw error;
  }
}

// Cleanup function to close browser when done
export async function cleanup(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
} 