#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Get all markdown files in _posts directory
const postsDir = path.join(__dirname, "_posts");
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));

files.forEach((file) => {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  // Extract front matter and body
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    console.log(`Skipping ${file} - no front matter found`);
    return;
  }

  let frontMatter = frontMatterMatch[1];
  let body = frontMatterMatch[2];

  // Check if there's a source link in the body
  const sourceMatch = body.match(/\*\*\[Source\]\((.*?)\)\*\*/);

  if (sourceMatch) {
    const sourceUrl = sourceMatch[1];

    // Add source to front matter if not already there
    if (!frontMatter.includes("source:")) {
      frontMatter += `\nsource: ${sourceUrl}`;
    }

    // Remove the source line from body
    body = body.replace(/\n*\*\*\[Source\]\(.*?\)\*\*\n*/g, "\n");

    // Trim trailing whitespace from body
    body = body.trimEnd() + "\n";

    // Write back the updated content
    const newContent = `---\n${frontMatter}\n---\n${body}`;
    fs.writeFileSync(filePath, newContent, "utf8");

    console.log(`Updated ${file}`);
  } else {
    console.log(`No source link found in ${file}`);
  }
});

console.log("Done!");
