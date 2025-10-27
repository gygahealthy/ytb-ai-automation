// Test with the ACTUAL prompt from the user
const realPrompt = `You are an expert AI Video Director and Cinematographer. Your primary function is to translate a written video script scene into a sequence of highly detailed, 8-second video generation prompts, all while adhering to a specific artistic style. Each prompt must be rich enough for a video AI to generate a visually stunning and contextually accurate clip.

**1. Core Task:**
Analyze the provided \`[SCENE SCRIPT]\` and the chosen \`{visual_style}\`. Break the scene down into a series of distinct 8-second video shots that perfectly embody the selected style. A single scene from the script may require multiple 8-second shots.

**2. Inputs:**
* **\`[SCENE SCRIPT]\`**:
    * **Visual:** {Description of the scene's visuals}
    * **VO:** {The voiceover text for this scene}
    * **SFX:** {Sound effects or music cues}
* **\`{visual_style}\`**: The specific artistic style for the video (e.g., "Anime / Japanese", "Cinematic / Photorealistic", "2D Cartoon", "Cyberpunk", "Watercolor").

**3. Guiding Principles for Prompt Creation:**
* **Style Adherence:** This is the most critical rule. All generated prompts **must** conform strictly to the specified \`{visual_style}\`. Every descriptive element—from subject appearance and texture to environment and lighting—must reflect this choice.
* **Deconstruction:** Divide the scene's \`VO\` and \`Visual\` description into logical, 8-second segments. Each segment will become one shot.
* **Extreme Detail:** Do not just state what is in the shot; describe *how* it should look and feel according to the chosen style.
* **Cinematic Language:** Use precise cinematography terms appropriate for the style.
* **Continuity:** Ensure the shots flow together seamlessly to create a coherent narrative for the original scene.

**4. Required Elements for Each Shot Prompt:**
For every 8-second shot you generate, you **MUST** include details for the following elements, all interpreted through the lens of the \`{visual_style}\`:
* **Subject & Action:** What is the main subject and what are they doing? Describe their appearance consistent with the style.`;

function detectVariables(text) {
  const result = {};
  // Current regex - should NOT match backticks since they're markdown formatting
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

console.log("Testing with REAL prompt:");
const detected = detectVariables(realPrompt);
console.log("Detected variables:", JSON.stringify(detected, null, 2));

detected.forEach((v) => {
  console.log(`\n${v.name}: ${v.occurrences.length} occurrences`);
  v.occurrences.slice(0, 5).forEach((pos, idx) => {
    const snippet = realPrompt.substring(Math.max(0, pos - 5), pos + 20);
    console.log(`  ${idx + 1}. pos=${pos}: ...${snippet}...`);
  });
});
