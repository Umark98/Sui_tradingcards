import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Clear all display JSON files when a new package is published
 * This ensures old display objects from previous package versions don't persist
 */
export async function POST(request: NextRequest) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    
    // List of display JSON files to clear
    const displayFiles = [
      'genesis-displays.json',
      'mission-displays.json',
      'frontend-metadata-ids.json',
      'contract-objects.json'
    ];

    const clearedFiles: string[] = [];
    const errors: string[] = [];

    for (const fileName of displayFiles) {
      const filePath = path.join(publicDir, fileName);
      
      try {
        if (fs.existsSync(filePath)) {
          // Clear the file by writing an empty object
          fs.writeFileSync(filePath, '{}', 'utf-8');
          clearedFiles.push(fileName);
          console.log(`Cleared ${fileName}`);
        } else {
          console.log(`File ${fileName} does not exist, skipping`);
        }
      } catch (error) {
        const errorMsg = `Failed to clear ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Display files cleared successfully',
      clearedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error clearing display files:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear display files', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

