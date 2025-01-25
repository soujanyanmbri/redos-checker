const fs = require('fs');
const path = require('path');

/**
 * Recursively read files from a directory, supports multiple file types.
 * @param {string} dir - Directory to scan
 * @param {string[]} fileTypes - File extensions to look for (e.g., ['.java', '.js'])
 * @returns {string[]} - List of file paths
 */
function readFiles(dir, fileTypes = ['.java']) {
  let files = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(readFiles(fullPath, fileTypes));
    } else if (fileTypes.some(ext => fullPath.endsWith(ext))) {
      files.push(fullPath);
    }
  });
  return files;
}

/**
 * Extract regex patterns from code.
 * @param {string} code - Code as a string
 * @returns {string[]} - List of regex patterns
 */
function extractRegex(code) {
    const regexPatterns = [];
    const patterns = [
      // Pattern.compile() with string literal
      /Pattern\.compile\((['"])([^'"]*)\1\)/g,
      // Dynamic regex with string concatenation
      /Pattern\.compile\(['"](.*?)['"]\s*\+\s*[A-Za-z_][A-Za-z0-9_]*/g,
      // Concatenated regex patterns
      /Pattern\.compile\((['"]+.*?[+']\s*[A-Za-z_][A-Za-z0-9_]*\s*['"]+)\)/g
    ];
  
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        // Extract the actual regex pattern, removing quotes and extra whitespace
        const extractedPattern = match[2] || match[1];
        if (extractedPattern && !regexPatterns.includes(extractedPattern)) {
          regexPatterns.push(extractedPattern.trim());
        }
      }
    });
  
    return regexPatterns;
  }






module.exports = { readFiles, extractRegex };
