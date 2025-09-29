import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { getDeploymentConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const config = getDeploymentConfig();
    const metadataFilePath = config.metadataIdsPath;
    
    if (!fs.existsSync(metadataFilePath)) {
      return NextResponse.json({});
    }

    const data = fs.readFileSync(metadataFilePath, 'utf-8');
    const metadataIds = JSON.parse(data);

    return NextResponse.json(metadataIds);
  } catch (error) {
    console.error('Error reading metadata IDs:', error);
    return NextResponse.json(
      { error: 'Failed to read metadata IDs' },
      { status: 500 }
    );
  }
}
