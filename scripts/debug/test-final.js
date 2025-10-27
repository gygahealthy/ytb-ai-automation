// Final test - simulating the exact scenario from the screenshot
const testPrompt = `
**3. Guiding Principles for Prompt Creation:**
* **Style Adherence:** This is the most critical rule. All generated prompts **must** conform strictly to the specified \`{visual_style}\`. Every descriptive element—from subject appearance and texture to environment and lighting—must reflect this choice.
* **Deconstruction:** Divide the scene's \`VO\` and \`Visual\` description into logical, 8-second segments. Each segment will become one shot.
* **Extreme Detail:** Do not just state what is in the shot; describe *how* it should look and feel according to the chosen style.
* **Cinematic Language:** Use precise cinematography terms appropriate for the style.
* **Continuity:** Ensure the shots flow together seamlessly to create a coherent narrative for the original scene.

**4. Required Elements for Each Shot Prompt:**
For every 8-second shot you generate, you **MUST** include details for the following elements, all interpreted through the lens of the \`{visual_style}\`:
* **Subject & Action:** What is the main subject and what are they doing? Describe their appearance consistent with the style.
* **Camera Shot & Angle:** Specify the shot type and angle (e.g., "Medium shot, eye-level," "Extreme close-up," "High-angle wide shot").
* **Camera Movement:** Describe any camera movement (e.g., "Slow dolly in," "Static shot," "Gentle pan from left to right").
* **Lighting:** Describe the lighting style and mood that fits the aesthetic (e.g., "Soft, cel-shaded anime lighting," "Dramatic, high-contrast noir lighting").
* **Setting & Environment:** Detail the background and surroundings as they would appear in the chosen style.
* **Style & Aesthetics:** Explicitly translate the \`{visual_style}\` input into descriptive keywords. For example:
    * **If \`{visual_style}\` is "Anime / Japanese":** Use keywords
    * **If \`{visual_style}\` is "Cinematic / Photorealistic":** Use
    * **If \`{visual_style}\` is "Cyberpunk":** Use keywords like
* **Color Palette:** Suggest the dominant colors that define the style's tone.`;

// Updated detection logic (without backtick support)
function detectVariables(text) {
  const result = {};
  const combinedRe = /["']?(\[([A-Za-z0-9_]+)\]|\{([A-Za-z0-9_]+)\})["']?/g;
  let m;

  while ((m = combinedRe.exec(text))) {
    const name = m[2] || m[3];
    const matchStart = m.index;
    const bracketPart = m[1];
    const fullMatch = m[0];
    const quoteOffset = fullMatch.indexOf(bracketPart);
    const idx = matchStart + quoteOffset;

    if (!result[name]) result[name] = { name, occurrences: [] };
    result[name].occurrences.push(idx);
  }

  return Object.keys(result).map((k) => ({
    name: k,
    occurrences: result[k].occurrences,
  }));
}

console.log("=== Final Test ===");
const vars = detectVariables(testPrompt);
console.log(
  "Detected:",
  vars.map((v) => `${v.name} (${v.occurrences.length}x)`).join(", ")
);

vars.forEach((v) => {
  console.log(`\n${v.name}: ${v.occurrences.length} occurrences`);
  v.occurrences.forEach((pos, i) => {
    const before = testPrompt.substring(Math.max(0, pos - 3), pos);
    const varText = testPrompt.substring(pos, pos + 15);
    console.log(`  ${i + 1}. [${pos}] "${before}${varText}"`);
  });
});
