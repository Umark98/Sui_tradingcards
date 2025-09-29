import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { getDeploymentConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Read the published contracts JSON file
    const config = getDeploymentConfig();
    const outputPath = config.publishedContractsPath;
    
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: 'No published contracts data found' },
        { status: 404 }
      );
    }

    const data = fs.readFileSync(outputPath, 'utf-8');
    const contractData = JSON.parse(data);

    return NextResponse.json(contractData);
  } catch (error) {
    console.error('Error reading published contracts data:', error);
    return NextResponse.json(
      { error: 'Failed to read published contracts data' },
      { status: 500 }
    );
  }
}