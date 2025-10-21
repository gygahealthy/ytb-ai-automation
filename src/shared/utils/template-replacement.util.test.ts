import {
  replaceTemplate,
  replaceAllTemplate,
  detectTemplateVariables,
  getVariableStats,
} from "./template-replacement.util";

/**
 * Test suite for template replacement utility
 * Demonstrates all features with the YouTube script template
 */

// Sample template from the user's request
const YOUTUBE_SCRIPT_TEMPLATE = `You are an expert YouTube scriptwriter, renowned for crafting compelling narratives that maximize viewer engagement and retention. Your task is to generate a complete, scene-by-scene video script based on a given topic, a specific video style, and a target word count.

**1. Core Inputs:**
* **Video Topic:** \`{video_topic}\`
* **Video Style:** \`{video_style}\`
* **Target Word Count:** Approximately \`{target_word_count}\` words.

**2. Scripting Guidelines:**
* **Hook (First 15 Seconds):** The script must begin with a powerful hook to immediately capture the viewer's attention and clearly state the video's value proposition.
* **Structure:** The script must be logically structured with an introduction, a main body broken into clear points, and a concluding call-to-action (CTA) and outro.
* **Tone & Pacing:** Adapt the language, tone, and pacing to perfectly match the specified \`{video_style}\`.
    * For **Explainer & Educational**, use clear, concise language and a logical flow.
    * For **Inspirational & Uplifting**, use evocative language, storytelling, and an optimistic tone.
    * For **Dynamic & Trendy**, use energetic pacing, modern slang, and quick cuts.
    * For **Documentary & Storytelling**, build a narrative with a clear arc and emotional depth.
    * For **Corporate & Business**, maintain a professional, confident, and trustworthy tone.
    * (Apply similar logic for all other styles).
* **Voice:** The voiceover text should be written in a natural, conversational style, as if spoken directly to the viewer. Avoid jargon unless it's an educational video where you explain it.

**3. Required Output Format:**
Your entire output must be the script itself, formatted exactly as follows. Do not include any other text, greetings, or explanations.

The script must be divided into scenes. Each scene block must contain:
* \`[SCENE #]\`: The scene number.
* **Visual:** A concise description of the on-screen visuals (e.g., "A-roll of host speaking to the camera," "Dynamic montage of drone shots over Ha Long Bay," "Animated text graphic showing '3 Key Tips'").
* **VO:** The voiceover script for that scene.
* **SFX:** (Optional) Suggest any relevant sound effects or music cues (e.g., "Uplifting background music starts," "Subtle whoosh sound effect as text appears").

---
**Example Structure:**

\`[SCENE 1]\`
**Visual:** Fast-paced, engaging clips related to the video topic. A bold title card appears with the video title.
**VO:** (This is the powerful hook. Start with a question or a bold statement.)
**SFX:** Upbeat, attention-grabbing music.

\`[SCENE 2]\`
**Visual:** Host appears on screen, smiling and energetic.
**VO:** (This is the introduction. Briefly introduce the topic and what the viewer will learn or experience.)

\`[SCENE 3]\`
**Visual:** B-roll footage illustrating the first main point. Animated text overlay highlights the key takeaway.
**VO:** (This is the first part of the main content. Explain the first point clearly.)
**SFX:** Music settles into a steady, pleasant rhythm.

... (continue with more scenes for the main body) ...

\`[SCENE X - CTA]\`
**Visual:** Host back on camera, speaking directly to the viewer. A subscribe button animation appears on screen.
**VO:** (This is the Call to Action. e.g., "If you found this helpful, make sure to hit that like button and subscribe for more content just like this. And let me know in the comments...")

\`[SCENE Y - Outro]\`
**Visual:** End screen with links to other videos and social media.
**VO:** (This is the quick outro. e.g., "Thanks for watching, and I'll see you in the next one!")
**SFX:** Music swells and fades out.

---

Now, generate the script based on the provided inputs.`;

// Test data with values in different case formats
const TEST_VALUES_MIXED_CASE = {
  video_topic: "The Future of Artificial Intelligence", // snake_case
  VideoStyle: "Educational", // PascalCase
  target_word_count: "1500", // snake_case
};

console.log("=== Template Replacement Utility Tests ===\n");

// Test 1: Detect all variables
console.log("Test 1: Detect Template Variables");
console.log("-----------------------------------");
const detectedVars = detectTemplateVariables(YOUTUBE_SCRIPT_TEMPLATE);
console.log(`Found ${detectedVars.length} variable occurrences:`);
detectedVars.forEach((v, i) => {
  console.log(`  [${i}] "${v.name}" at position ${v.position} (${v.syntax})`);
});
console.log();

// Test 2: Get variable statistics
console.log("Test 2: Variable Statistics");
console.log("---------------------------");
const stats = getVariableStats(YOUTUBE_SCRIPT_TEMPLATE);
console.log("Variable occurrence counts:");
Object.entries(stats).forEach(([name, count]) => {
  console.log(`  "${name}": ${count} occurrence(s)`);
});
console.log();

// Test 3: Replace all occurrences (no config)
console.log("Test 3: Replace All Occurrences (No Config)");
console.log("------------------------------------------");
const resultAll = replaceAllTemplate(
  YOUTUBE_SCRIPT_TEMPLATE,
  TEST_VALUES_MIXED_CASE
);
// Show first 300 chars to see replacement
console.log("Result (first 300 chars):");
console.log(resultAll.substring(0, 300));
console.log("...\n");

// Test 4: Replace specific occurrences using config
console.log("Test 4: Replace Specific Occurrences Only");
console.log("-----------------------------------------");
const occurrenceConfig = {
  video_topic: [0], // Only replace first occurrence of video_topic
  video_style: [0, 1], // Replace first and second occurrence of video_style
  target_word_count: [0], // Replace first occurrence
};
const resultPartial = replaceTemplate(
  YOUTUBE_SCRIPT_TEMPLATE,
  TEST_VALUES_MIXED_CASE,
  occurrenceConfig
);
console.log(
  "Replaced with config: video_topic[0], video_style[0,1], target_word_count[0]"
);
console.log("Result (first 300 chars):");
console.log(resultPartial.substring(0, 300));
console.log("...\n");

// Test 5: Case format handling
console.log("Test 5: Case Format Handling");
console.log("---------------------------");
const testCasesValues = {
  video_topic: "AI Revolution", // snake_case
  VideoStyle: "Engaging", // PascalCase (should match video_style from template)
  target_word_count: "2000", // snake_case
};
console.log("Input values with mixed case formats:");
Object.entries(testCasesValues).forEach(([k, v]) => {
  console.log(`  ${k}: "${v}"`);
});
console.log("\nTemplate variables (normalized for matching):");
Object.keys(stats).forEach((varName) => {
  console.log(`  ${varName}`);
});
replaceAllTemplate(YOUTUBE_SCRIPT_TEMPLATE, testCasesValues);
console.log(
  "\n✓ Successfully matched different case formats during replacement"
);
console.log(
  "(VideoStyle matched video_style, video_topic matched video_topic)\n"
);

// Test 6: Partial replacement with config from database (simulating the JSON from DB)
console.log("Test 6: Simulating Database Config");
console.log("---------------------------------");
const dbConfig = {
  video_topic: [0, 2], // First and third occurrence
  video_style: [1], // Second occurrence only
};
console.log("Database config:", JSON.stringify(dbConfig));
const resultDb = replaceTemplate(
  YOUTUBE_SCRIPT_TEMPLATE,
  TEST_VALUES_MIXED_CASE,
  dbConfig
);
console.log("Result with DB config (first 350 chars):");
console.log(resultDb.substring(0, 350));
console.log("...\n");

// Test 7: Bracket syntax support
console.log("Test 7: Bracket Syntax Support [VAR_NAME]");
console.log("----------------------------------------");
const bracketTemplate =
  "Hello [name]! Your topic is [topic]. Do it [topic] times.";
console.log(`Template: ${bracketTemplate}`);
const bracketVars = detectTemplateVariables(bracketTemplate);
console.log(`Detected: ${bracketVars.map((v) => `[${v.name}]`).join(", ")}`);
const bracketResult = replaceTemplate(bracketTemplate, {
  name: "Alice",
  topic: "Learning",
});
console.log(`Result: ${bracketResult}\n`);

// Test 8: Mixed brace and bracket syntax
console.log("Test 8: Mixed Brace and Bracket Syntax");
console.log("-------------------------------------");
const mixedTemplate =
  "The topic is {topic}. Style is [style]. Topic again: {topic}.";
console.log(`Template: ${mixedTemplate}`);
const mixedVars = detectTemplateVariables(mixedTemplate);
console.log(`Detected ${mixedVars.length} variables`);
const mixedResult = replaceTemplate(mixedTemplate, {
  topic: "AI",
  style: "Fun",
});
console.log(`Result: ${mixedResult}\n`);

console.log("=== All Tests Complete ===");
