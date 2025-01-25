const { spawn } = require('child_process');
const { analyzePatterns } = require('./utils');

const javaProgramPath = require('path').resolve(__dirname, '../java_code/my-app/build/libs/my-app-1.0-SNAPSHOT-all.jar');

async function extractPatterns(dirPath) {
  return new Promise((resolve, reject) => {
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
          resolve(patterns);
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      } else {
        reject(new Error(`Java process exited with code ${code}`));
      }
    });

    javaProcess.on('error', (error) => {
      reject(new Error(`Failed to start Java process: ${error.message}`));
    });
  });
}

async function extractAndAnalyze(dirPath) {
  const patterns = await extractPatterns(dirPath);
  return await analyzePatterns(patterns);
}

module.exports = { extractAndAnalyze };
