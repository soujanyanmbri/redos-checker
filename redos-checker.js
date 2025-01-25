// redos-checker.js

// Import required libraries
const fs = require('fs');
const path = require('path');
const { check } = require('recheck'); // Use the asynchronous check method

/**
 * Recursively read files from a directory
 * @param {string} dir - Directory to scan
 * @returns {string[]} - List of file paths
 */
function readFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(readFiles(fullPath));
    } else if (fullPath.endsWith('.java')) { // Filter Java files
      files.push(fullPath);
    }
  });
  return files;
}

/**
 * Extract regex patterns from Java code, including multi-line patterns
 * @param {string} code - Java code as a string
 * @returns {string[]} - List of regex patterns
 */
function extractRegexFromJava(code) {
  const regexPatterns = [];
  const regexLiteralPattern = /Pattern\.compile\(("[\s\S]*?"|\"[\s\S]*?\")\)/g; // Matches Pattern.compile("regex") even across multiple lines

  let match;
  while ((match = regexLiteralPattern.exec(code)) !== null) {
    regexPatterns.push(match[1].replace(/\"/g, '"')); // Normalize escaped quotes
  }

  return regexPatterns;
}

/**
 * Generate a report for the analyzed patterns
 * @param {Array} reportData - List of objects with pattern and analysis details
 */
function generateReport(reportData) {
  console.log("\n--- ReDoS Analysis Report ---\n");
  console.log("| Pattern | Status | Details |");
  console.log("|---------|--------|---------|");
  reportData.forEach(({ pattern, safe, details }) => {
    console.log(`| ${pattern} | ${safe ? 'Safe ✅' : 'Vulnerable ❌'} | ${details || 'N/A'} |`);
  });
}

/**
 * Analyze regex patterns for potential ReDoS vulnerabilities
 * @param {string[]} patterns - List of regex patterns
 * @returns {Promise<Array>} - List of analysis results
 */
async function analyzePatterns(patterns) {
  const reportData = [];
  for (const pattern of patterns) {
    try {
      const result = await check(pattern, ""); // Use asynchronous check method
      reportData.push({
        pattern,
        safe: result.safe,
        details: result.safe ? '' : JSON.stringify(result)
      });
    } catch (error) {
      console.error(`Error analyzing pattern: ${pattern}`, error);
      reportData.push({
        pattern,
        safe: false,
        details: `Error: ${error.message}`
      });
    }
  }
  return reportData;
}

/**
 * Main function
 * @param {string} dirPath - Directory to scan
 */
async function main(dirPath) {
  console.log(`Scanning directory: ${dirPath}`);

  // Step 1: Read all Java files
  const files = readFiles(dirPath);
  console.log(`Found ${files.length} Java file(s)`);

  // Step 2: Extract regex patterns
  let allPatterns = [];
  files.forEach((file) => {
    const code = fs.readFileSync(file, 'utf8');
    const patterns = extractRegexFromJava(code);
    allPatterns = allPatterns.concat(patterns);
  });

  console.log(`Extracted ${allPatterns.length} regex pattern(s)`);

  // Print out all the patterns
  console.log("All patterns:");
  console.log(allPatterns);

  // Step 3: Analyze regex patterns
  const analysisResults = await analyzePatterns(allPatterns);

  // Step 4: Generate report
  generateReport(analysisResults);
}

// Run the program
const directoryToScan = process.argv[2] || '.'; // Pass directory as argument or use current directory
main(directoryToScan);
