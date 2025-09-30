/**
 * Centralized Contract Address Management
 * Provides a single source of truth for contract addresses across the application
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ContractAddresses {
  packageId: string;
  adminCapId: string;
  upgradeCapId: string;
  publisherId: string;
  timestamp?: string;
  network?: string;
}

/**
 * Get current contract addresses from .env.local (priority) or contract-objects.json
 * Environment variables take priority as they are updated after contract publishing
 */
export function getCurrentContractAddresses(): ContractAddresses {
  // Priority 1: Environment variables from .env.local (updated after publishing)
  if (process.env.PACKAGE_ID && process.env.ADMIN_CAP_ID && process.env.PUBLISHER_ID && process.env.UPGRADE_CAP_ID) {
    return {
      packageId: process.env.PACKAGE_ID,
      adminCapId: process.env.ADMIN_CAP_ID,
      publisherId: process.env.PUBLISHER_ID,
      upgradeCapId: process.env.UPGRADE_CAP_ID,
      network: 'testnet'
    };
  }

  // Priority 2: Fallback to contract-objects.json
  try {
    const contractObjectsPath = path.join(process.cwd(), 'public', 'contract-objects.json');
    if (fs.existsSync(contractObjectsPath)) {
      const data = fs.readFileSync(contractObjectsPath, 'utf-8');
      const contractData = JSON.parse(data);
      return {
        packageId: contractData.packageId || '',
        adminCapId: contractData.adminCapId || '',
        publisherId: contractData.publisherId || '',
        upgradeCapId: contractData.upgradeCapId || '',
        timestamp: contractData.timestamp,
        network: contractData.network || 'testnet'
      };
    }
  } catch (error) {
    console.log('Error reading contract-objects.json:', error);
  }
  
  // Priority 3: Empty fallback
  return {
    packageId: '',
    adminCapId: '',
    publisherId: '',
    upgradeCapId: '',
    network: 'testnet'
  };
}

/**
 * Generate object type string with current package ID
 */
export function generateObjectType(cardType: string): string {
  const addresses = getCurrentContractAddresses();
  return `${addresses.packageId}::gadget_gameplay_items::GadgetGameplayItemMetadata<${addresses.packageId}::gadget_gameplay_items::TradingCard<${addresses.packageId}::gadget_gameplay_items_titles::${cardType}>>`;
}

/**
 * Generate trading card type string with current package ID
 */
export function generateTradingCardType(cardType: string): string {
  const addresses = getCurrentContractAddresses();
  return `${addresses.packageId}::gadget_gameplay_items::TradingCard<${addresses.packageId}::gadget_gameplay_items_titles::${cardType}>`;
}

/**
 * Check if a package ID matches the current one
 */
export function isCurrentPackageId(packageId: string): boolean {
  const addresses = getCurrentContractAddresses();
  return addresses.packageId === packageId;
}

/**
 * Update package ID in a string (for metadata updates)
 */
export function updatePackageIdInString(content: string, newPackageId: string): string {
  const addresses = getCurrentContractAddresses();
  const oldPackageId = addresses.packageId;
  
  if (!oldPackageId || !newPackageId || oldPackageId === newPackageId) {
    return content;
  }
  
  // Replace the old package ID with new one
  const regex = new RegExp(oldPackageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return content.replace(regex, newPackageId);
}

/**
 * Validate that contract addresses are available
 */
export function validateContractAddresses(): { valid: boolean; missing: string[] } {
  const addresses = getCurrentContractAddresses();
  const missing: string[] = [];
  
  if (!addresses.packageId) missing.push('packageId');
  if (!addresses.adminCapId) missing.push('adminCapId');
  if (!addresses.publisherId) missing.push('publisherId');
  if (!addresses.upgradeCapId) missing.push('upgradeCapId');
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get contract addresses for API responses
 */
export function getContractAddressesForAPI(): ContractAddresses {
  const addresses = getCurrentContractAddresses();
  const validation = validateContractAddresses();
  
  if (!validation.valid) {
    throw new Error(`Missing contract addresses: ${validation.missing.join(', ')}`);
  }
  
  return addresses;
}
