// Debug test - exact simulation of the scenario
const sampleText = `* **\`{visual_style}\`**: The specific artistic style for the video
(e.g., "Anime / Japanese", "Cinematic / Photorealistic", "2D
Cartoon", "Cyberpunk", "Watercolor").

**3. Guiding Principles for Prompt Creation:**
* **Style Adherence:** This is the most critical rule. All generated
prompts **must** conform strictly to the specified \`{visual_style}\`.
Every descriptive element—from subject appearance and texture to
environment and lighting—must reflect this choice.`;

// Current regex (without backtick)
const regex = /["']?(\[([A-Za-z0-9_]+)\]|\{([A-Za-z0-9_]+)\})["']?/g;

console.log("=== Testing Detection ===");
console.log("Sample text length:", sampleText.length);
console.log("\nSearching for {visual_style}...\n");

let match;
let count = 0;
const positions = [];

while ((match = regex.exec(sampleText))) {
  count++;
  const name = match[2] || match[3];
  const matchStart = match.index;
  const bracketPart = match[1];
  const fullMatch = match[0];
  const quoteOffset = fullMatch.indexOf(bracketPart);
  const bracketPos = matchStart + quoteOffset;

  positions.push(bracketPos);

  // Show context around the match
  const contextStart = Math.max(0, bracketPos - 5);
  const contextEnd = Math.min(sampleText.length, bracketPos + 20);
  const context = sampleText.substring(contextStart, contextEnd);

  console.log(`Match ${count}:`);
  console.log(`  Full match: "${fullMatch}"`);
  console.log(`  Bracket part: "${bracketPart}"`);
  console.log(`  Match starts at: ${matchStart}`);
  console.log(`  Bracket at: ${bracketPos}`);
  console.log(`  Context: "${context}"`);
  console.log(`  Char at bracketPos: "${sampleText[bracketPos]}"`);
  console.log("");
}

console.log(`Total found: ${count}`);
console.log("Positions:", positions);

// Test findVariableEnd
function findVariableEnd(text, startPos) {
  const sub = text.substring(startPos);
  const match = sub.match(/^(\[([A-Za-z0-9_]+)\]|\{([A-Za-z0-9_]+)\})/);
  if (match) {
    return startPos + match[0].length;
  }
  return startPos + 1;
}

console.log("\n=== Testing Selection Ranges ===");
positions.forEach((pos, idx) => {
  const end = findVariableEnd(sampleText, pos);
  const selected = sampleText.substring(pos, end);
  console.log(`${idx + 1}. pos=${pos}, end=${end}, selected="${selected}"`);
});
