/**
 * Deployment Configuration
 * Handles different environments (development, production, Vercel, Netlify, etc.)
 */

import * as path from 'path';

export interface DeploymentConfig {
  // Sui CLI path - needs to be configured per deployment
  suiCliPath: string;
  
  // Blockchain contracts path
  blockchainContractsPath: string;
  
  // Project paths
  projectRoot: string;
  publicDir: string;
  
  // File paths
  contractObjectsPath: string;
  metadataIdsPath: string;
  publishedContractsPath: string;
  envFilePath: string;
  updateScriptPath: string;
  
  // Documentation paths
  adminReadmePath: string;
  adminSchemaPath: string;
}

/**
 * Get deployment configuration based on environment
 */
export function getDeploymentConfig(): DeploymentConfig {
  const projectRoot = process.cwd();
  const publicDir = path.join(projectRoot, 'public');
  
  // Determine Sui CLI path based on environment
  let suiCliPath: string;
  
  if (process.env.VERCEL) {
    // Vercel deployment
    suiCliPath = process.env.SUI_CLI_PATH || '/usr/local/bin/sui';
  } else if (process.env.NETLIFY) {
    // Netlify deployment
    suiCliPath = process.env.SUI_CLI_PATH || '/opt/buildhome/.cargo/bin/sui';
  } else if (process.env.NODE_ENV === 'production') {
    // Generic production deployment
    suiCliPath = process.env.SUI_CLI_PATH || '/usr/local/bin/sui';
  } else {
    // Development environment
    suiCliPath = process.env.SUI_CLI_PATH || 'sui'; // Use system PATH in development
  }
  
  // Blockchain contracts path - relative to project root
  const blockchainContractsPath = path.join(projectRoot, '..', 'blockchain-contracts');
  
  return {
    suiCliPath,
    blockchainContractsPath,
    projectRoot,
    publicDir,
    
    // File paths
    contractObjectsPath: path.join(publicDir, 'contract-objects.json'),
    metadataIdsPath: path.join(publicDir, 'metadata-ids.json'),
    publishedContractsPath: path.join(blockchainContractsPath, 'setup', 'src', 'published-contracts.json'),
    envFilePath: path.join(projectRoot, '.env.local'),
    updateScriptPath: path.join(projectRoot, 'scripts', 'update-documentation.js'),
    
    // Documentation paths
    adminReadmePath: path.join(projectRoot, 'ADMIN_README.md'),
    adminSchemaPath: path.join(projectRoot, 'setup', 'admin_schema.sql')
  };
}

/**
 * Validate deployment configuration
 */
export function validateDeploymentConfig(config: DeploymentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if Sui CLI exists (only in production environments)
  if (process.env.NODE_ENV === 'production' && !config.suiCliPath) {
    errors.push('SUI_CLI_PATH environment variable is required in production');
  }
  
  // Check if blockchain contracts directory exists
  if (!config.blockchainContractsPath) {
    errors.push('Blockchain contracts path is not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get environment-specific settings
 */
export function getEnvironmentSettings() {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: !!process.env.VERCEL,
    isNetlify: !!process.env.NETLIFY,
    isServerless: !!(process.env.VERCEL || process.env.NETLIFY)
  };
}
