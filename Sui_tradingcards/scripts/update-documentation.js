#!/usr/bin/env node

/**
 * Automated Documentation Update Script
 * Updates hardcoded package IDs and admin caps in documentation files
 * when new contracts are published
 */

const fs = require('fs');
const path = require('path');

// Get the project root directory
const PROJECT_ROOT = path.join(__dirname, '..');

// Paths to files that need updating (relative to project root)
const FILES_TO_UPDATE = [
  path.join(PROJECT_ROOT, 'ADMIN_README.md'),
  path.join(PROJECT_ROOT, 'setup', 'admin_schema.sql')
];

// Contract objects file path
const CONTRACT_OBJECTS_PATH = path.join(PROJECT_ROOT, 'public', 'contract-objects.json');

/**
 * Get current contract addresses from contract-objects.json
 */
function getCurrentContractAddresses() {
  try {
    if (fs.existsSync(CONTRACT_OBJECTS_PATH)) {
      const data = fs.readFileSync(CONTRACT_OBJECTS_PATH, 'utf-8');
      const contractData = JSON.parse(data);
      return {
        packageId: contractData.packageId,
        adminCapId: contractData.adminCapId,
        upgradeCapId: contractData.upgradeCapId,
        publisherId: contractData.publisherId
      };
    }
  } catch (error) {
    console.error('Error reading contract-objects.json:', error);
  }
  return null;
}

/**
 * Update package ID in a string
 */
function updatePackageId(content, oldPackageId, newPackageId) {
  if (!oldPackageId || !newPackageId) return content;
  
  // Replace the old package ID with new one
  const regex = new RegExp(oldPackageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return content.replace(regex, newPackageId);
}

/**
 * Update admin cap ID in a string
 */
function updateAdminCapId(content, oldAdminCapId, newAdminCapId) {
  if (!oldAdminCapId || !newAdminCapId) return content;
  
  // Replace the old admin cap ID with new one
  const regex = new RegExp(oldAdminCapId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return content.replace(regex, newAdminCapId);
}

/**
 * Update a single file
 */
function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    console.log(`Updating file: ${filePath}`);
    
    // Read current content
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Get current contract addresses
    const contractAddresses = getCurrentContractAddresses();
    if (!contractAddresses) {
      console.log('No contract addresses found, skipping update');
      return;
    }
    
    // Find existing package IDs in the content
    const packageIdRegex = /0x[a-fA-F0-9]{64}/g;
    const existingPackageIds = content.match(packageIdRegex) || [];
    
    // Update all package IDs to the current one
    existingPackageIds.forEach(oldPackageId => {
      if (oldPackageId !== contractAddresses.packageId) {
        content = updatePackageId(content, oldPackageId, contractAddresses.packageId);
        console.log(`  Updated package ID: ${oldPackageId} -> ${contractAddresses.packageId}`);
      }
    });
    
    // Update admin cap IDs if they exist
    if (contractAddresses.adminCapId) {
      const adminCapRegex = /0x[a-fA-F0-9]{64}/g;
      const existingAdminCaps = content.match(adminCapRegex) || [];
      
      existingAdminCaps.forEach(oldAdminCapId => {
        if (oldAdminCapId !== contractAddresses.adminCapId && oldAdminCapId !== contractAddresses.packageId) {
          content = updateAdminCapId(content, oldAdminCapId, contractAddresses.adminCapId);
          console.log(`  Updated admin cap ID: ${oldAdminCapId} -> ${contractAddresses.adminCapId}`);
        }
      });
    }
    
    // Write updated content if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ File updated successfully`);
    } else {
      console.log(`  ℹ️  No updates needed`);
    }
    
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔄 Starting automated documentation update...');
  
  const contractAddresses = getCurrentContractAddresses();
  if (!contractAddresses) {
    console.error('❌ No contract addresses found. Make sure contracts are published first.');
    process.exit(1);
  }
  
  console.log('📋 Current contract addresses:');
  console.log(`  Package ID: ${contractAddresses.packageId}`);
  console.log(`  Admin Cap ID: ${contractAddresses.adminCapId}`);
  console.log(`  Upgrade Cap ID: ${contractAddresses.upgradeCapId}`);
  console.log(`  Publisher ID: ${contractAddresses.publisherId}`);
  console.log('');
  
  // Update each file
  FILES_TO_UPDATE.forEach(updateFile);
  
  console.log('');
  console.log('✅ Documentation update completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentContractAddresses,
  updateFile,
  updatePackageId,
  updateAdminCapId
};
