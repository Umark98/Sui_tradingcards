#!/usr/bin/env node

/**
 * Update Documentation Script
 * 
 * This script updates documentation files with the latest contract addresses
 * and deployment information after successful contract publishing.
 */

const fs = require('fs');
const path = require('path');

// Get the project root directory
const projectRoot = path.dirname(path.dirname(__filename));

// Paths to documentation files
const docsPath = path.join(projectRoot, 'DEPLOYMENT_GUIDE.md');
const readmePath = path.join(projectRoot, 'README.md');

// Environment file path
const envPath = path.join(projectRoot, '.env.local');

// Contract addresses file path
const contractAddressesPath = path.join(projectRoot, 'public', 'contract-objects.json');

function readEnvFile() {
  try {
    if (!fs.existsSync(envPath)) {
      console.log('No .env.local file found');
      return {};
    }
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error reading .env.local file:', error);
    return {};
  }
}

function readContractAddresses() {
  try {
    if (!fs.existsSync(contractAddressesPath)) {
      console.log('No contract-objects.json file found');
      return {};
    }
    
    const contractData = JSON.parse(fs.readFileSync(contractAddressesPath, 'utf-8'));
    return contractData;
  } catch (error) {
    console.error('Error reading contract-objects.json file:', error);
    return {};
  }
}

function updateDeploymentGuide(envVars, contractData) {
  try {
    if (!fs.existsSync(docsPath)) {
      console.log('DEPLOYMENT_GUIDE.md not found, skipping update');
      return;
    }
    
    let content = fs.readFileSync(docsPath, 'utf-8');
    
    // Update contract addresses section
    const contractSection = `## Contract Addresses

The following contract addresses are automatically updated after deployment:

- **Package ID**: \`${envVars.PACKAGE_ID || 'Not deployed'}\`
- **Admin Cap ID**: \`${envVars.ADMIN_CAP_ID || 'Not deployed'}\`
- **Publisher ID**: \`${envVars.PUBLISHER_ID || 'Not deployed'}\`
- **Upgrade Cap ID**: \`${envVars.UPGRADE_CAP_ID || 'Not deployed'}\`

### Network Information
- **Network**: Sui Testnet
- **Last Updated**: ${new Date().toISOString()}

### Contract Objects
${contractData && Object.keys(contractData).length > 0 ? 
  Object.entries(contractData).map(([key, value]) => `- **${key}**: \`${value}\``).join('\n') :
  'No contract objects found'
}`;

    // Replace or add the contract addresses section
    const contractRegex = /## Contract Addresses[\s\S]*?(?=##|$)/;
    if (contractRegex.test(content)) {
      content = content.replace(contractRegex, contractSection);
    } else {
      content += '\n\n' + contractSection;
    }
    
    fs.writeFileSync(docsPath, content, 'utf-8');
    console.log('✅ Updated DEPLOYMENT_GUIDE.md');
    
  } catch (error) {
    console.error('Error updating DEPLOYMENT_GUIDE.md:', error);
  }
}

function updateReadme(envVars) {
  try {
    if (!fs.existsSync(readmePath)) {
      console.log('README.md not found, skipping update');
      return;
    }
    
    let content = fs.readFileSync(readmePath, 'utf-8');
    
    // Update deployment status
    const deploymentStatus = `## Deployment Status

- **Package ID**: \`${envVars.PACKAGE_ID || 'Not deployed'}\`
- **Network**: Sui Testnet
- **Last Deployed**: ${envVars.PACKAGE_ID ? new Date().toISOString() : 'Not deployed'}`;

    // Replace or add the deployment status section
    const statusRegex = /## Deployment Status[\s\S]*?(?=##|$)/;
    if (statusRegex.test(content)) {
      content = content.replace(statusRegex, deploymentStatus);
    } else {
      content += '\n\n' + deploymentStatus;
    }
    
    fs.writeFileSync(readmePath, content, 'utf-8');
    console.log('✅ Updated README.md');
    
  } catch (error) {
    console.error('Error updating README.md:', error);
  }
}

function main() {
  console.log('🔄 Updating documentation with latest contract addresses...');
  
  // Read environment variables and contract data
  const envVars = readEnvFile();
  const contractData = readContractAddresses();
  
  console.log('📋 Found environment variables:', Object.keys(envVars));
  console.log('📋 Found contract data keys:', Object.keys(contractData));
  
  // Update documentation files
  updateDeploymentGuide(envVars, contractData);
  updateReadme(envVars);
  
  console.log('✅ Documentation update completed successfully');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, readEnvFile, readContractAddresses };
