import { spawn, ChildProcess } from 'child_process';
import puppeteer, { Browser } from 'puppeteer';
import { Logger } from '../../../../utils/logger.util';
import { Profile } from '../../profile-management/profile.types';

const logger = new Logger('BrowserManager');

export interface BrowserInstance {
  browser: Browser;
  debugPort: number;
  process?: ChildProcess;
}

/**
 * Shared browser management utility
 * Handles spawning Chrome instances with remote debugging
 */
export class BrowserManager {
  private activeBrowsers: Map<string, BrowserInstance> = new Map();

  async launchBrowserWithDebugging(
    profile: Profile,
    options?: { headless?: boolean }
  ): Promise<{ success: boolean; browser?: Browser; debugPort?: number; process?: ChildProcess; error?: string }> {
    try {
      let executablePath = profile.browserPath;

      if (!executablePath) {
        executablePath = this.getDefaultChromePath();
        if (!executablePath) {
          return { success: false, error: 'No browser path configured and Chrome not found. Please configure a browser path in the profile settings.' };
        }
        logger.info(`Using auto-detected Chrome path: ${executablePath}`);
      }

      const debugPort = 9222 + Math.floor(Math.random() * 1000);
      logger.info(`Using debugging port: ${debugPort}`);

      const chromeArgs = [
        `--remote-debugging-port=${debugPort}`,
        '--remote-debugging-address=127.0.0.1',
        `--user-data-dir=${profile.userDataDir}`,
        '--start-maximized',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-popup-blocking',
        '--disable-sync',
      ];

      if (profile.userAgent) chromeArgs.push(`--user-agent=${profile.userAgent}`);
      if (options?.headless) chromeArgs.push('--headless=new');

      logger.info('Launching Chrome with debugging enabled...');

      const chromeProcess = spawn(executablePath, chromeArgs, { detached: true, stdio: 'ignore' });
      try { chromeProcess.unref(); } catch (e) { /* ignore */ }

      logger.info('Chrome process started, waiting for debugging port...');

      const maxRetries = 15;
      const retryDelay = 1000;
      let browser: Browser | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          logger.info(`Connection attempt ${i + 1}/${maxRetries}...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${debugPort}`, defaultViewport: null });
          logger.info('Successfully connected to Chrome instance!');
          break;
        } catch (err) {
          if (i === maxRetries - 1) {
            logger.error('Failed to connect after all retries', err);
            return { success: false, error: `Failed to connect to Chrome after ${maxRetries} attempts. Port: ${debugPort}` };
          }
        }
      }

      if (!browser) return { success: false, error: 'Failed to establish connection to Chrome' };

      return { success: true, browser, debugPort, process: chromeProcess };
    } catch (error) {
      logger.error('Failed to launch browser', error);
      return { success: false, error: String(error) };
    }
  }

  registerBrowser(sessionId: string, browser: Browser, debugPort: number, process?: ChildProcess): void {
    this.activeBrowsers.set(sessionId, { browser, debugPort, process });
  }

  getBrowser(sessionId: string): BrowserInstance | undefined {
    return this.activeBrowsers.get(sessionId);
  }

  async closeBrowser(sessionId: string): Promise<void> {
    const instance = this.activeBrowsers.get(sessionId);
    if (!instance) return;

    try {
      // Try to close gracefully
      try {
        if ((instance.browser as any).close) {
          await (instance.browser as any).close();
          logger.info(`Closed browser for session: ${sessionId}`);
        } else {
          await instance.browser.disconnect();
          logger.info(`Disconnected browser for session: ${sessionId}`);
        }
      } catch (err) {
        // fallback to disconnect
        try {
          await instance.browser.disconnect();
          logger.info(`Disconnected browser for session (fallback): ${sessionId}`);
        } catch (e) {
          logger.error('Failed to close or disconnect browser', e);
        }
      }

      // kill underlying process if we have it
      if (instance.process) {
        try {
          instance.process.kill();
          logger.info(`Killed browser process for session: ${sessionId}`);
        } catch (err) {
          logger.error(`Failed to kill browser process for session ${sessionId}:`, err);
        }
      }
    } catch (error) {
      logger.error(`Failed to disconnect browser for session: ${sessionId}`, error);
    }

    this.activeBrowsers.delete(sessionId);
  }

  private getDefaultChromePath(): string | undefined {
    const fs = require('fs');
    const path = require('path');
    const platform = process.platform;

    if (platform === 'win32') {
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
      ];

      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) return chromePath;
      }
    } else if (platform === 'darwin') {
      const possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        path.join(process.env.HOME || '', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      ];

      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) return chromePath;
      }
    } else {
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
      ];

      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) return chromePath;
      }
    }

    return undefined;
  }
}

export const browserManager = new BrowserManager();
