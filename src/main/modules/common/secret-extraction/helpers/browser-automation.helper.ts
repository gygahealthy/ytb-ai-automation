import puppeteer, { Browser, Page } from 'puppeteer-core';
import { Logger } from '../../../../../shared/utils/logger';
import { ExtractedScriptContent } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Detect Chrome executable path on Windows
 */
function findChromeExecutable(): string | undefined {
  const possiblePaths = [
    // Chrome stable
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    // Chrome beta/dev/canary
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome SxS\\Application\\chrome.exe'),
    // Edge Chromium
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
  ];

  for (const chromePath of possiblePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  return undefined;
}

/**
 * Helper class for browser automation using Puppeteer
 * Extracts script content from Next.js applications
 */
export class BrowserAutomationHelper {
  private browser?: Browser;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('BrowserAutomationHelper');
  }

  /**
   * Initialize browser instance
   */
  async initialize(executablePath?: string): Promise<void> {
    if (this.browser) {
      return; // Already initialized
    }

    try {
      this.logger.info('Initializing headless browser...');
      
      const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
      };

      // Auto-detect Chrome if not provided
      const chromePath = executablePath || findChromeExecutable();
      if (!chromePath) {
        throw new Error(
          'Chrome executable not found. Please install Chrome or provide executablePath. ' +
          'Checked locations: Program Files, Program Files (x86), LocalAppData'
        );
      }

      launchOptions.executablePath = chromePath;
      this.logger.info(`Using Chrome at: ${chromePath}`);

      this.browser = await puppeteer.launch(launchOptions);
      this.logger.info('Browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract script content from a target URL using script pattern
   */
  async extractScriptContent(
    targetUrl: string,
    scriptPattern: RegExp,
    timeout: number = 30000
  ): Promise<ExtractedScriptContent[]> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page: Page = await this.browser.newPage();

    try {
      this.logger.info(`Navigating to ${targetUrl}...`);
      
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout,
      });

      this.logger.info('Page loaded, extracting script URLs...');

      // Extract all script src attributes that match the pattern
      const scriptUrls = await page.evaluate((patternSource: string) => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const pattern = new RegExp(patternSource);
        
        return scripts
          .map((s) => s.getAttribute('src'))
          .filter((src): src is string => src !== null && pattern.test(src))
          .map((src) => {
            // Resolve relative URLs to absolute
            try {
              return new URL(src, window.location.href).href;
            } catch {
              return src;
            }
          });
      }, scriptPattern.source);

      this.logger.info(`Found ${scriptUrls.length} matching script(s): ${scriptUrls.join(', ')}`);

      // Fetch each script's content
      const results: ExtractedScriptContent[] = [];
      
      for (const url of scriptUrls) {
        try {
          this.logger.info(`Fetching script content from ${url}...`);
          
          const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
          const content = await response?.text();
          
          if (content) {
            results.push({
              scriptUrl: url,
              content,
              size: content.length,
              fetchedAt: new Date().toISOString(),
            });
            this.logger.info(`Fetched script: ${url} (${content.length} bytes)`);
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch script ${url}:`, error);
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Script extraction failed:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      this.logger.info('Closing browser...');
      await this.browser.close();
      this.browser = undefined;
      this.logger.info('Browser closed');
    }
  }

  /**
   * Check if browser is initialized
   */
  isInitialized(): boolean {
    return !!this.browser;
  }
}
