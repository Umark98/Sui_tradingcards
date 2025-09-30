import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    const metadataFilePath = path.join(process.cwd(), 'public', 'frontend-metadata-ids.json');
    
    if (!fs.existsSync(metadataFilePath)) {
      return NextResponse.json({});
    }

    const data = fs.readFileSync(metadataFilePath, 'utf-8');
    const metadata = JSON.parse(data);

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error reading frontend metadata:', error);
    return NextResponse.json(
      { error: 'Failed to read frontend metadata' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardType, metadata } = body;

    if (!cardType || !metadata) {
      return NextResponse.json(
        { error: 'Card type and metadata are required' },
        { status: 400 }
      );
    }

    const metadataFilePath = path.join(process.cwd(), 'public', 'frontend-metadata-ids.json');
    
    // Read existing metadata
    let existingMetadata: Record<string, any> = {};
    if (fs.existsSync(metadataFilePath)) {
      const data = fs.readFileSync(metadataFilePath, 'utf-8');
      existingMetadata = JSON.parse(data);
    }

    // Add new metadata
    existingMetadata[cardType] = {
      ...metadata,
      timestamp: new Date().toISOString(),
      createdFrom: 'frontend'
    };

    // Write back to file
    fs.writeFileSync(metadataFilePath, JSON.stringify(existingMetadata, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Metadata for ${cardType} saved successfully`,
      metadata: existingMetadata[cardType]
    });
  } catch (error) {
    console.error('Error saving frontend metadata:', error);
    return NextResponse.json(
      { error: 'Failed to save frontend metadata' },
      { status: 500 }
    );
  }
}
