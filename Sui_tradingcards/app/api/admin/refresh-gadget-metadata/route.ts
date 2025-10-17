import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Fetch metadata objects from blockchain and extract level-specific images
 * for Gadget cards (Mallet, Yoyo, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Sui client
    const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
    const client = new SuiClient({ url: getFullnodeUrl(network) });

    // Load existing metadata IDs
    const metadataIdsPath = path.join(process.cwd(), 'public', 'Gadget-minted-metadata.json');
    
    if (!fs.existsSync(metadataIdsPath)) {
      return NextResponse.json({
        success: false,
        error: 'No metadata IDs found. Create metadata first.',
      }, { status: 404 });
    }

    const metadataIds = JSON.parse(fs.readFileSync(metadataIdsPath, 'utf-8'));
    const updatedMetadata: any = {};

    // Fetch each metadata object and extract level-specific images
    for (const [cardType, metadataInfo] of Object.entries(metadataIds)) {
      const { objectId } = metadataInfo as any;
      
      if (!objectId) {
        console.log(`No objectId for ${cardType}, skipping`);
        updatedMetadata[cardType] = metadataInfo;
        continue;
      }

      try {
        console.log(`Fetching metadata for ${cardType}:`, objectId);
        
        // Fetch the metadata object from blockchain
        const metadataObject = await client.getObject({
          id: objectId,
          options: {
            showContent: true,
          },
        });

        console.log(`Fetched metadata for ${cardType}`);

        // Extract level-specific images from the metadata
        const levelImages: Record<number, string> = {};
        
        if (metadataObject.data?.content) {
          const content = metadataObject.data.content as any;
          
          // media_urls_display is a VecMap<u16, String> stored as an object with fields
          if (content.fields && content.fields.media_urls_display) {
            const mediaUrlsDisplay = content.fields.media_urls_display;
            
            // VecMap is stored as { type: "...", fields: { contents: [...] } }
            if (mediaUrlsDisplay.fields && Array.isArray(mediaUrlsDisplay.fields.contents)) {
              mediaUrlsDisplay.fields.contents.forEach((entry: any) => {
                // Each entry is { type: "...", fields: { key: level, value: url } }
                if (entry.fields && entry.fields.key && entry.fields.value) {
                  const level = parseInt(entry.fields.key);
                  const imageUrl = entry.fields.value;
                  levelImages[level] = imageUrl;
                  console.log(`  Level ${level}: ${imageUrl}`);
                }
              });
            }
          }
        }

        // Save updated metadata with level-specific images
        updatedMetadata[cardType] = {
          ...(metadataInfo as any),
          levelImages: levelImages,
          imageUrl: levelImages[1] || (metadataInfo as any).imageUrl || '', // Default to level 1
          lastFetched: new Date().toISOString(),
        };

        console.log(`Updated ${cardType} with ${Object.keys(levelImages).length} level images`);

      } catch (error) {
        console.error(`Error fetching metadata for ${cardType}:`, error);
        // Keep existing data if fetch fails
        updatedMetadata[cardType] = metadataInfo;
      }
    }

    // Write updated metadata back to file
    fs.writeFileSync(metadataIdsPath, JSON.stringify(updatedMetadata, null, 2), 'utf-8');
    console.log('Updated Gadget-minted-metadata.json with level-specific images');

    return NextResponse.json({
      success: true,
      message: 'Gadget metadata refreshed with level-specific images',
      metadata: updatedMetadata,
    });

  } catch (error) {
    console.error('Error refreshing gadget metadata:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh gadget metadata', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

