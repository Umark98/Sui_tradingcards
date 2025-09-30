import { NextRequest, NextResponse } from 'next/server';
import { getCurrentContractAddresses } from '@/lib/contract-addresses';

/**
 * API endpoint to get current contract addresses
 * Returns addresses from .env.local (priority) or contract-objects.json (fallback)
 * This allows frontend components to access the most current contract addresses
 */
export async function GET(request: NextRequest) {
  try {
    const contractAddresses = getCurrentContractAddresses();
    
    // Validate that we have all required addresses
    if (!contractAddresses.packageId || !contractAddresses.adminCapId || !contractAddresses.publisherId || !contractAddresses.upgradeCapId) {
      return NextResponse.json(
        { 
          error: 'Contract addresses not available. Please publish contracts first.',
          missing: {
            packageId: !contractAddresses.packageId,
            adminCapId: !contractAddresses.adminCapId,
            publisherId: !contractAddresses.publisherId,
            upgradeCapId: !contractAddresses.upgradeCapId
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contractAddresses: {
        packageId: contractAddresses.packageId,
        adminCapId: contractAddresses.adminCapId,
        publisherId: contractAddresses.publisherId,
        upgradeCapId: contractAddresses.upgradeCapId,
        network: contractAddresses.network,
        timestamp: contractAddresses.timestamp
      },
      source: process.env.PACKAGE_ID ? 'environment' : 'contract-objects.json'
    });

  } catch (error) {
    console.error('Error getting contract addresses:', error);
    return NextResponse.json(
      { error: 'Failed to get contract addresses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
