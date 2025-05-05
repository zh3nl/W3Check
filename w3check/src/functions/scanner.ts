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

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error(`Error extracting domain from ${url}:`, error);
    return '';
  }
}

// Extract URLs from a webpage
async function extractUrlsFromPage(page: Page, baseDomain: string): Promise<string[]> {
  try {
    // Extract all links from the page
    const urls = await page.evaluate((domain) => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links
        .map(link => {
          const href = link.getAttribute('href');
          if (!href) return null;
          
          try {
            // Handle relative URLs
            const url = new URL(href, window.location.origin);
            // Only include URLs from the same domain
            if (url.hostname === domain) {
              // Normalize URL by removing hash fragments and standardizing trailing slashes
              let normalizedUrl = url.origin + url.pathname;
              // Add trailing slash to directory URLs for consistency
              if (!normalizedUrl.endsWith('/') && !normalizedUrl.includes('.')) {
                normalizedUrl += '/';
              }
              // Add query parameters if they exist
              if (url.search) {
                normalizedUrl += url.search;
              }
              return normalizedUrl;
            }
          } catch (error) {
            console.error(`Error processing URL: ${href}`, error);
            return null;
          }
          return null;
        })
        .filter(Boolean) as string[];
    }, baseDomain);
    
    // Remove duplicates and return
    return [...new Set(urls)];
  } catch (error) {
    console.error('Error extracting URLs:', error);
    return [];
  }
}

// Run accessibility scan on a single page
async function scanPage(url: string): Promise<ScanResult> {
  const browser = await getBrowser();
  const page = await initPage(browser);
  let violations: ViolationType[] = [];
  let passes = 0;
  let incomplete = 0;
  let inapplicable = 0;
  let status: 'completed' | 'failed' = 'completed';
  let pageContent = '';
  
  try {
    // Navigate to the URL with improved waiting strategy
    await page.goto(url, { 
      waitUntil: ['networkidle2', 'domcontentloaded'],
      timeout: 60000 // Increase timeout to 60 seconds for slow pages
    });
    
    // Additional waiting to ensure page is fully rendered
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 30000 }).catch(e => {
      console.warn(`Page readyState timeout for ${url}, continuing anyway:`, e.message);
    });
    
    // Wait a bit longer for any lazy-loaded content or JS frameworks
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get page content for AI analysis
    pageContent = await page.content();
    
    // Verify page is valid before running axe analysis
    const isPageValid = await page.evaluate(() => {
      return document.body !== null && document.readyState === 'complete';
    }).catch(() => false);
    
    if (!isPageValid) {
      throw new Error('Page DOM is not ready for accessibility testing');
    }
    
    // Run axe-core analysis with retry logic
    let retries = 3;
    let axeResults = null;
    
    while (retries > 0) {
      try {
        axeResults = await new AxeBuilder(page)
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();
        break; // Success, exit the retry loop
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error; // Re-throw if all retries failed
        }
        console.warn(`AxeBuilder analysis failed, retrying (${retries} attempts left):`, (error as Error).message);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retrying
      }
    }
    
    // Ensure axeResults is defined before proceeding
    if (!axeResults) {
      throw new Error('Failed to obtain accessibility results');
    }
    
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

// Crawl and scan a website recursively
async function crawlAndScan(
  startUrl: string,
  maxDepth: number,
  maxPages: number = 100
): Promise<ScanResult[]> {
  const browser = await getBrowser();
  const page = await initPage(browser);
  const results: ScanResult[] = [];
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [];
  const baseDomain = extractDomain(startUrl);
  
  // Normalize the start URL for consistency
  try {
    const urlObj = new URL(startUrl);
    const normalizedStartUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');
    queue.push({ url: normalizedStartUrl, depth: 0 });
  } catch (error) {
    console.error(`Error normalizing start URL: ${startUrl}`, error);
    queue.push({ url: startUrl, depth: 0 });
  }
  
  try {
    // If maxDepth is very large (e.g., 100), we're crawling the entire site with safeguards
    const isFullSiteCrawl = maxDepth >= 50;
    // Set a safety limit on the maximum number of pages to crawl
    const pageSafetyLimit = isFullSiteCrawl ? 200 : maxPages;
    
    console.log(`Starting crawl: ${startUrl}, max depth: ${maxDepth}, limit: ${pageSafetyLimit} pages`);
    
    while (queue.length > 0 && results.length < pageSafetyLimit) {
      const { url, depth } = queue.shift()!;
      
      // Skip if already visited or reached max depth
      if (visited.has(url) || depth > maxDepth) continue;
      
      // Mark as visited
      visited.add(url);
      
      console.log(`Crawling ${url} (depth ${depth}/${maxDepth}, page ${results.length+1}/${pageSafetyLimit})`);
      
      try {
        // Scan the page
        const result = await scanPage(url);
        results.push(result);
        
        // Don't crawl further if max depth reached
        if (depth >= maxDepth) continue;
        
        // Navigate to extract URLs with improved waiting strategy
        try {
          await page.goto(url, { 
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 60000 
          });
          
          // Wait for page to be fully loaded
          await page.waitForFunction(() => {
            return document.readyState === 'complete';
          }, { timeout: 30000 }).catch(e => {
            console.warn(`Page readyState timeout during crawling of ${url}, continuing anyway:`, e.message);
          });
          
          // Wait a bit longer for any lazy-loaded content
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Extract URLs for crawling
          const links = await extractUrlsFromPage(page, baseDomain);
          console.log(`Found ${links.length} links on ${url}`);
          
          // Add new URLs to the queue
          for (const link of links) {
            if (!visited.has(link) && results.length < pageSafetyLimit) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        } catch (navigationError) {
          console.error(`Error navigating to ${url} during crawling:`, navigationError);
          // Continue with the next URL in the queue, we already have the scan result
        }
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        // Add a failed result for this URL
        results.push({
          id: Date.now().toString(),
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
    
    console.log(`Crawl completed. Processed ${results.length} pages out of ${visited.size} discovered URLs.`);
  } catch (error) {
    console.error('Crawl and scan error:', error);
  } finally {
    await page.close();
  }
  
  return results;
}

// Helper function to create a failed scan result
function createFailedScanResult(url: string, id: string): ScanResult {
  return {
    id,
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

// Scan a single URL with specified crawl depth
export async function scanSingleUrl(
  url: string, 
  maxDepth: number = 1,
  scanId: string
): Promise<ScanResult | ScanResult[]> {
  try {
    if (maxDepth > 1) {
      // If depth > 1, crawl the website recursively
      const results = await crawlAndScan(url, maxDepth - 1, 10);
      return results.map((result, i) => {
        result.id = i === 0 ? scanId : `${scanId}-${i}`;
        return result;
      });
    } else {
      // Just scan a single page
      const result = await scanPage(url);
      result.id = scanId;
      return result;
    }
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

// Scan multiple URLs in batch mode with parallel processing
export async function scanBatchUrls(
  urls: string[], 
  maxDepth: number = 1,
  scanId: string
): Promise<ScanResult[]> {
  try {
    // Set a reasonable concurrency limit to avoid overloading the system
    const CONCURRENCY_LIMIT = 3;
    const allResults: ScanResult[] = [];
    let resultIndex = 0;
    
    // Process URLs in batches to maintain the concurrency limit
    for (let i = 0; i < urls.length; i += CONCURRENCY_LIMIT) {
      const batch = urls.slice(i, i + CONCURRENCY_LIMIT);
      
      // Create promises for each URL in the current batch
      const promises = batch.map(async (url) => {
        try {
          if (maxDepth > 1) {
            // If depth > 1, crawl the website recursively
            const results = await crawlAndScan(url, maxDepth - 1, 5);
            return results.map(result => {
              const index = resultIndex++;
              result.id = `${scanId}-${index}`;
              return result;
            });
          } else {
            // Just scan a single page
            const result = await scanPage(url);
            result.id = `${scanId}-${resultIndex++}`;
            return [result];
          }
        } catch (error) {
          console.error(`Error scanning batch URL ${url}:`, error);
          return [createFailedScanResult(url, `${scanId}-${resultIndex++}`)];
        }
      });
      
      // Wait for all promises in the current batch to resolve
      const batchResultsArrays = await Promise.all(promises);
      // Flatten the array of arrays
      const batchResults = batchResultsArrays.flat();
      allResults.push(...batchResults);
    }
    
    return allResults;
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