import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface DeleteDisplayRequest {
  cardType: string;
}

// Genesis card types
const GENESIS_CARD_TYPES = [
  'CommemorativeCard1',
  'CommemorativeCard2', 
  'CommemorativeCard3',
  'CommemorativeCard4'
];

export async function DELETE(request: NextRequest) {
  try {
    const { cardType }: DeleteDisplayRequest = await request.json();
    
    console.log('Received delete display request for:', cardType);

    // Validate card type
    if (!GENESIS_CARD_TYPES.includes(cardType)) {
      return NextResponse.json(
        { error: `Invalid card type. Must be one of: ${GENESIS_CARD_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const displayFilePath = path.join(process.cwd(), 'public', 'genesis-displays.json');
    
    // Check if display file exists
    if (!fs.existsSync(displayFilePath)) {
      return NextResponse.json(
        { error: 'No display objects found' },
        { status: 404 }
      );
    }

    // Read existing displays
    const existingData = fs.readFileSync(displayFilePath, 'utf-8');
    const existingDisplays = JSON.parse(existingData);
    
    // Check if the card type exists
    if (!existingDisplays[cardType]) {
      return NextResponse.json(
        { error: `Display object for ${cardType} not found` },
        { status: 404 }
      );
    }

    // Remove the card type from displays
    const { [cardType]: removedDisplay, ...updatedDisplays } = existingDisplays;
    
    // Write updated displays to file
    fs.writeFileSync(displayFilePath, JSON.stringify(updatedDisplays, null, 2), 'utf-8');

    console.log(`Display deleted successfully for ${cardType}`);

    return NextResponse.json({
      success: true,
      cardType,
      message: `Display deleted successfully for ${cardType}`,
      deletedDisplay: removedDisplay
    });

  } catch (error) {
    console.error('Error deleting genesis display:', error);
    return NextResponse.json(
      { error: 'Failed to delete display', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

