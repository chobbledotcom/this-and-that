#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_URL = 'https://github.com/chobbledotcom/google-reviews-iframe.git';
const TEMP_DIR = path.join(__dirname, '..', 'temp-reviews');
const REVIEWS_DIR = path.join(TEMP_DIR, 'reviews', 'this-and-that');
const OUTPUT_FILE = path.join(__dirname, '..', 'reviews.md');

// Blacklist of words that exclude reviews from being included
const BLACKLIST_WORDS = ['rude', 'disappointing'];

function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    console.log('Cleaning up temporary directory...');
    execSync(`rm -rf "${TEMP_DIR}"`, { stdio: 'inherit' });
  }
}

function cloneRepo() {
  console.log('Cloning Google reviews repository...');
  try {
    execSync(`git clone "${REPO_URL}" "${TEMP_DIR}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to clone repository:', error.message);
    process.exit(1);
  }
}

function loadReviews() {
  if (!fs.existsSync(REVIEWS_DIR)) {
    console.error(`Reviews directory not found: ${REVIEWS_DIR}`);
    return [];
  }

  const reviewFiles = fs.readdirSync(REVIEWS_DIR)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => {
      // Sort by filename (which should contain date) to get newest first
      return b.localeCompare(a);
    });

  const reviews = [];
  
  for (const file of reviewFiles) {
    try {
      const filePath = path.join(REVIEWS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const review = JSON.parse(content);
      
      // Only include 5-star reviews with a body
      if (review.rating === 5 && review.content && review.content.trim().length > 0) {
        const reviewText = review.content.toLowerCase().trim();
        
        // Check if review contains any blacklisted words
        const hasBlacklistedWord = BLACKLIST_WORDS.some(word => 
          reviewText.includes(word.toLowerCase())
        );
        
        if (!hasBlacklistedWord) {
          reviews.push({
            ...review,
            fileName: file
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to parse review file ${file}:`, error.message);
    }
  }

  return reviews;
}

function formatReviewDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function generateReviewsMd(reviews) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let content = `---
layout: page
cssClass: page--praise
metaTitle: "Kind Words From Our Customers - Reviews of T&T"
permalink: /reviews/
title: "Reviews of T&T"
subtitle: "We feel your love"
---

**Some of the kind words people have left on [our Google Maps listing](https://goo.gl/maps/xTNreANmJEz) over the years:**

❤️❤️❤️

_Last update: ${currentDate}_

---

`;

  // Add reviews, newest first
  for (const review of reviews) {
    const reviewText = review.content.trim();
    const relativeTime = review.relativeTimeDescription || '';
    
    content += `---

${reviewText}

`;
  }

  return content;
}

function main() {
  try {
    // Cleanup any existing temp directory
    cleanup();
    
    // Clone the repository
    cloneRepo();
    
    // Load and filter reviews
    console.log('Loading reviews...');
    const reviews = loadReviews();
    console.log(`Found ${reviews.length} 5-star reviews with bodies`);
    
    if (reviews.length === 0) {
      console.log('No reviews to process');
      cleanup();
      return;
    }
    
    // Generate the new reviews.md content
    console.log('Generating reviews.md...');
    const newContent = generateReviewsMd(reviews);
    
    // Write to reviews.md
    fs.writeFileSync(OUTPUT_FILE, newContent, 'utf8');
    console.log(`Updated ${OUTPUT_FILE} with ${reviews.length} reviews`);
    
    // Cleanup
    cleanup();
    
    console.log('Done!');
    
  } catch (error) {
    console.error('Error:', error.message);
    cleanup();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, cleanup, cloneRepo, loadReviews, generateReviewsMd };