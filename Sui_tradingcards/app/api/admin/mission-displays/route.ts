import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    const displayFilePath = path.join(process.cwd(), 'public', 'mission-displays.json');
    
    if (!fs.existsSync(displayFilePath)) {
      return NextResponse.json({});
    }

    const data = fs.readFileSync(displayFilePath, 'utf-8');
    const displays = JSON.parse(data);

    return NextResponse.json(displays);
  } catch (error) {
    console.error('Error reading mission displays:', error);
    return NextResponse.json(
      { error: 'Failed to read mission displays' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cardType, displayId, packageId, publisherId } = await request.json();

    if (!cardType || !displayId) {
      return NextResponse.json(
        { error: 'Card type and display ID are required' },
        { status: 400 }
      );
    }

    const displayFilePath = path.join(process.cwd(), 'public', 'mission-displays.json');
    
    // Read existing displays
    let existingDisplays = {};
    try {
      if (fs.existsSync(displayFilePath)) {
        const existingData = fs.readFileSync(displayFilePath, 'utf-8');
        existingDisplays = JSON.parse(existingData);
      }
    } catch (error) {
      console.log('No existing display file found, creating new one');
    }
    
    // Add new display
    const updatedDisplays = {
      ...existingDisplays,
      [cardType]: {
        displayId,
        cardType,
        timestamp: new Date().toISOString(),
        packageId: packageId || null,
        publisherId: publisherId || null
      }
    };
    
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write updated displays to file
    fs.writeFileSync(displayFilePath, JSON.stringify(updatedDisplays, null, 2), 'utf-8');

    console.log(`Mission display saved for ${cardType}:`, displayId);

    return NextResponse.json({
      success: true,
      displayId,
      cardType,
      message: `Mission display saved for ${cardType}`
    });

  } catch (error) {
    console.error('Error saving mission display:', error);
    return NextResponse.json(
      { error: 'Failed to save mission display', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
