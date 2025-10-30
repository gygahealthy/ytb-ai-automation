Yes, you can absolutely do this, and a **headless browser** is the perfect tool for the job.

The core challenge, as you've identified, is that the full filename of the JavaScript file (e.g., `_app-5a523b2e0dec6cb5.js`) changes with every build because Next.js includes a content hash in the name.

You cannot just request the `.js` file directly because you won't know its full name. Instead, you must first "ask" the main page where that file is.

-----

### ⚙️ How to Automate This with a Headless Browser

Here is the step-by-step logic you would use in a script with a tool like **Puppeteer** (for Chrome) or **Playwright** (cross-browser).

1.  **Launch the Headless Browser:** Start the browser in headless mode.
2.  **Load the Main Page:** Navigate to the website's homepage (e.g., `https://example.com`), not the `.js` file.
3.  **Get the Page HTML:** Once the page loads, get its full HTML content.
4.  **Find the Script URL:** Parse the HTML content (using regex or a DOM parser) to find the specific `<script>` tag you're looking for. Based on your image, you're looking for the `_app` chunk. You would search for a string that matches this pattern:
      * **Regex pattern:** `/_next/static/chunks/pages/_app-([a-f0-9]+)\.js`
5.  **Fetch the JavaScript File:** Once you've extracted the full file path (e.g., `/_next/static/chunks/pages/_app-5a523b2e0dec6cb5.js`), you can then make a *new* request to fetch the text content of that specific file (e.g., `https://example.com/_next/static/chunks/pages/_app-5a523b2e0dec6cb5.js`).
6.  **Search the JS Content:** Now you have the (likely minified) JavaScript code as one giant string. You can search this string for the key you need. A regex is perfect for this, especially if the key has a known prefix (like `AIzaSy...` as seen in your search).

Here is a conceptual code example using **Playwright** (in JavaScript/Node.js) to illustrate the process:

```javascript
import { chromium } from 'playwright';

// The key prefix you are looking for
const KEY_PREFIX = 'AIzaSy';
// The URL of the site you want to check
const TARGET_URL = 'https://example.com'; 

async function findKey() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Load the main page
  await page.goto(TARGET_URL);

  // 2. Get the page HTML
  const htmlContent = await page.content();

  // 3. Find the _app.js script URL using a regex
  const scriptRegex = /src="(\/_next\/static\/chunks\/pages\/_app-[a-f0-9]+\.js)"/;
  const match = htmlContent.match(scriptRegex);

  if (!match || !match[1]) {
    console.error('Could not find the _app.js script.');
    await browser.close();
    return;
  }

  const scriptUrl = new URL(match[1], TARGET_URL).href;
  console.log(`Found script URL: ${scriptUrl}`);

  // 4. Fetch the JavaScript file's content
  const scriptContent = await (await fetch(scriptUrl)).text();

  // 5. Search the content for the key
  const keyRegex = new RegExp(`(${KEY_PREFIX}[A-Za-z0-9-_]+)`, 'g');
  const keyMatch = scriptContent.match(keyRegex);

  if (keyMatch) {
    console.log(`🎉 Found key(s): ${keyMatch.join(', ')}`);
  } else {
    console.log('Could not find the key in the file.');
  }

  await browser.close();
}

findKey();
```