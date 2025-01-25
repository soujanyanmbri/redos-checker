const fs = require('fs');
const { type } = require('os');
const path = require('path');

/**
 * Generate HTML report
 * @param {Array} reportData - List of analysis results
 */
function generateHtmlReport(reportData) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ReDoS Analysis Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .safe {
            color: green;
          }
          .vulnerable {
            color: red;
          }
        </style>
      </head>
      <body>
        <h1>ReDoS Analysis Report</h1>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Pattern</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(item => `
              <tr>
                <td>${item.key || 'N/A'}</td>
                <td><code>${item.pattern}</code></td>
                <td class="${item.status === 'safe' ? 'safe' : item.status === 'vulnerable' ? 'vulnerable' : 'unknown'}">
                  ${item.status === 'safe' ? 'Safe ✅' : item.status === 'vulnerable' ? 'Vulnerable ❌' : 'Unknown ❓'}
                </td>
                <td>${item.details || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const reportPath = path.join(__dirname, 'report.html');
  fs.writeFileSync(reportPath, htmlContent);
  console.log(`HTML report generated: ${reportPath}`);
}

/**
 * Generate PDF report using Puppeteer
 * @param {Array} reportData - List of analysis results
 */
async function generatePdfReport(reportData) {
  const puppeteer = require('puppeteer');
  const htmlPath = path.join(__dirname, 'report.html');
  const pdfPath = path.join(__dirname, 'report.pdf');

  try {
    console.log('Generating PDF report...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Print out item details from reportData

    // Load the HTML content
    const htmlContent = `
      <html>
        <body>
          <h1>ReDoS Analysis Report</h1>
          <table border="1">
            <tr><th>Key</th><th>Pattern</th><th>Status</th><th>Details</th></tr>
            ${reportData.map(item => `
              <tr>
                <td>${item.key || 'N/A'}</td>
                <td><code>${item.pattern}</code></td>
                <td class="${item.status === 'safe' ? 'safe' : item.status === 'vulnerable' ? 'vulnerable' : 'unknown'}">
                  ${item.status === 'safe' ? 'Safe ✅' : item.status === 'vulnerable' ? 'Vulnerable ❌' : 'Unknown ❓'}
                </td>
                <td>${item.details || 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.pdf({ path: pdfPath, format: 'A4' });

    console.log(`PDF report generated: ${pdfPath}`);
    await browser.close();
  } catch (error) {
    console.error('Error generating PDF report:', error.message);
  }
}

module.exports = { generateHtmlReport, generatePdfReport };
