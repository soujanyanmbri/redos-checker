const { check } = require('recheck');
const { generateHtmlReport, generatePdfReport } = require('./reporter');
const { spawn } = require('child_process');


/**
 * Analyze regex patterns for potential ReDoS vulnerabilities
 * @param {Object} patternsObj - Object of regex patterns with keys as pattern names
 * @returns {Promise<Array>} - List of analysis results with pattern keys
 */
async function analyzePatterns(patternsObj) {
    const reportData = [];
  
    for (const [patternKey, pattern] of Object.entries(patternsObj)) {
      try {
        const result = await check(pattern, ""); // Use asynchronous check method
        reportData.push({
          key: patternKey, // Include the pattern key
          pattern,
          status: result.status,
          details: JSON.stringify(result)
        });
      } catch (error) {
        console.error(`Error analyzing pattern: ${pattern}`, error);
        reportData.push({
          key: patternKey, // Include the pattern key
          pattern,
          status: false,
          details: `Error: ${error.message}`
        });
      }
    }
  
    return reportData;
  }
  

/**
 * Extract regex patterns using the Java process
 * @param {string} dirPath - Directory to scan
 * @returns {Promise<string[]>} - List of extracted regex patterns
 */
function extractPatterns(dirPath) {
  return new Promise((resolve, reject) => {
    const javaProgramPath = require('path').resolve(__dirname, 'code_analysers/java_code/my-app/build/libs/my-app-1.0-SNAPSHOT-all.jar');
    const javaProcess = spawn('java', ['-jar', javaProgramPath, dirPath]);

    let jsonData = '';

    javaProcess.stdout.on('data', (data) => {
      jsonData += data.toString();
    });

    javaProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    javaProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const patterns = JSON.parse(jsonData);
        //   Print out the patterns
        console.log("All patterns:");
        console.log(patterns);
          resolve(patterns);
        } catch (error) {
          reject(`Error parsing JSON: ${error.message}`);
        }
      } else {
        reject(`Java process exited with code ${code}`);
      }
    });

    javaProcess.on('error', (error) => {
      reject(`Failed to start the Java process: ${error.message}`);
    });
  });
}

async function main(dirPath) {
    try {
      console.log(`Scanning directory: ${dirPath}`);
  
      // Step 1: Extract regex patterns
      const extractedData = await extractPatterns(dirPath);
  
      // Ensure patterns object exists in extractedData
      const patterns = extractedData.patterns || {}; // Fallback to empty object if `patterns` is undefined
      const patternCount = Object.keys(patterns).length;
      console.log(`Extracted ${patternCount} regex pattern(s)`);
  
      // Step 2: Analyze regex patterns (pass the full patterns object)
      const analysisResults = await analyzePatterns(patterns);
  
      // Step 3: Generate reports
      generateHtmlReport(analysisResults);
      generatePdfReport(analysisResults);
  
      console.log('Reports generated successfully.');
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  

  
// Accept directory as a command-line argument
const directoryToScan = process.argv[2] || '.'; // Default to current directory
main(directoryToScan);
