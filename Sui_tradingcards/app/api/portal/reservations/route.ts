// Get user's NFT reservations
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const client = await pool.connect();

    try {
      // Verify user exists in users table
      const userResult = await client.query(
        'SELECT user_id, user_email, wallet_address FROM users WHERE user_email = $1',
        [normalizedEmail]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Get user's NFT reservations from nft_reservations table
      const reservationsResult = await client.query(
        `SELECT 
          id,
          nft_title,
          nft_type,
          rarity,
          level,
          collection_name,
          description,
          metadata_uri,
          image_url,
          status,
          voucher_id,
          voucher_expiry,
          object_id,
          transaction_digest,
          created_at,
          minted_at
         FROM nft_reservations
         WHERE email = $1
         ORDER BY created_at DESC`,
        [normalizedEmail]
      );

      // Get user's NFTs from the nfts table
      const nftsResult = await client.query(
        `SELECT 
          n.nft_id,
          n.nft_title,
          n.nft_description,
          n.nft_serial_number,
          n.rarity,
          n.m_level,
          n.status,
          n.transaction_digest,
          n.minted_at,
          nt.type_name as nft_type,
          c.name as collection_name
         FROM nfts n
         LEFT JOIN nft_types nt ON n.type_id = nt.type_id
         LEFT JOIN collections c ON n.collection_id = c.collection_id
         WHERE n.user_id = $1
         ORDER BY n.nft_id DESC`,
        [user.user_id]
      );

      // Load display images from JSON files
      const missionDisplaysPath = path.join(process.cwd(), 'public', 'mission-displays.json');
      const genesisDisplaysPath = path.join(process.cwd(), 'public', 'genesis-displays.json');
      const metadataIdsPath = path.join(process.cwd(), 'public', 'frontend-metadata-ids.json');
      
      let displayImages: Record<string, string> = {};
      let gadgetMetadata: Record<string, any> = {};
      
      // Load mission displays
      try {
        if (fs.existsSync(missionDisplaysPath)) {
          const missionDisplays = JSON.parse(fs.readFileSync(missionDisplaysPath, 'utf-8'));
          Object.entries(missionDisplays).forEach(([cardType, data]: [string, any]) => {
            if (data.imageUrl) {
              displayImages[cardType] = data.imageUrl;
            }
          });
        }
      } catch (error) {
        console.error('Error loading mission displays:', error);
      }
      
      // Load genesis displays
      try {
        if (fs.existsSync(genesisDisplaysPath)) {
          const genesisDisplays = JSON.parse(fs.readFileSync(genesisDisplaysPath, 'utf-8'));
          Object.entries(genesisDisplays).forEach(([cardType, data]: [string, any]) => {
            if (data.imageUrl) {
              displayImages[cardType] = data.imageUrl;
            }
          });
        }
      } catch (error) {
        console.error('Error loading genesis displays:', error);
      }
      
      // Load gadget metadata (for level-specific images)
      try {
        if (fs.existsSync(metadataIdsPath)) {
          gadgetMetadata = JSON.parse(fs.readFileSync(metadataIdsPath, 'utf-8'));
        }
      } catch (error) {
        console.error('Error loading gadget metadata:', error);
      }
      
      console.log('Loaded display images for card types:', Object.keys(displayImages));
      console.log('Loaded gadget metadata for card types:', Object.keys(gadgetMetadata));
      
      // Helper function to get image URL for a card type and level
      const getImageUrl = (cardType: string, collectionName: string, level?: number): string | null => {
        // For Gadgets, ONLY show image if level-specific image exists
        if (collectionName === 'Gadgets' && gadgetMetadata[cardType]) {
          const metadata = gadgetMetadata[cardType];
          
          // ONLY return image if level-specific image exists
          if (level && metadata.levelImages && metadata.levelImages[level]) {
            console.log(`Using level-specific image for ${cardType} Level ${level}`);
            return metadata.levelImages[level];
          }
          
          // If level doesn't have an image, return null (no image)
          console.log(`No image defined for ${cardType} Level ${level}`);
          return null;
        }
        
        // For Genesis and Mission cards, use display images
        return displayImages[cardType] || null;
      };

      // Helper function to clean title (only remove specific patterns, not all numbers)
      const cleanTitle = (title: string): string => {
        // Only remove patterns like " #1002" or " #2001" (3+ digits) from the end
        // Keep " #1", " #2", " #3", " #4" (1-2 digits) as they are part of the card name
        return title.replace(/\s*#\d{3,}\s*$/, '').trim();
      };

      // Helper function to extract mint number - ALWAYS use nft_serial_number for ALL users and ALL categories
      const extractMintNumber = (serialNumber: string): number => {
        // nft_serial_number is the mint number for ALL collections (Gadgets, Genesis, Missions, etc.)
        if (serialNumber && serialNumber.trim() !== '') {
          return parseInt(serialNumber);
        }
        
        return 1; // Default fallback
      };

      // Helper function to get card level - ALWAYS use m_level for ALL users and ALL categories  
      const extractCardLevel = (mLevel: any): number => {
        // m_level is the card level for ALL collections (Gadgets, Genesis, Missions, etc.)
        if (mLevel && mLevel !== null && mLevel !== '') {
          return parseInt(mLevel);
        }
        
        return 1; // Default fallback
      };

      // Helper function to get card type from title
      const getCardTypeFromTitle = (title: string, nftType: string, collectionName: string): string => {
        // Handle Genesis cards
        if (title.includes('Genesis Commemorative Card')) {
          const match = title.match(/Genesis Commemorative Card #(\d+)/);
          if (match) {
            return `CommemorativeCard${match[1]}`;
          }
        }
        
        // Handle Mission cards
        if (collectionName === 'Missions' && title.includes('Mission:')) {
          const match = title.match(/Mission:\s+([A-Za-z\s]+)\s+\(([^)]+)\)/);
          if (match) {
            const city = match[1].trim().replace(/\s+/g, '');
            const rarityText = match[2].trim();
            
            let rarityType = '';
            if (rarityText === 'Rare') rarityType = 'Rare';
            else if (rarityText === 'Epic') rarityType = 'Epic';
            else if (rarityText === 'Legendary') rarityType = 'Legendary';
            else if (rarityText === 'Super Legendary') rarityType = 'SuperLegendary';
            else if (rarityText === 'Ultra-Common') rarityType = 'UltraCommon';
            else if (rarityText === 'Ultra-Common Signed') rarityType = 'UltraCommonSigned';
            
            if (rarityType) {
              return `Mission${city}${rarityType}`;
            }
          }
        }
        
        // Handle Gadget cards - use title directly as card type
        if (collectionName === 'Gadgets') {
          // For Gadgets, the title IS the card type (e.g., "Mallet", "Yoyo")
          return title.trim();
        }
        
        // Return the original nft_type if no special mapping needed
        return nftType || 'Unknown';
      };

      // Helper function to get rarity - ONLY use database values, no hardcoded extraction
      const getRarity = (existingRarity: string | null): string => {
        // Only use the rarity value directly from the database
        if (existingRarity && existingRarity.trim() !== '') {
          return existingRarity.trim();
        }
        
        return ''; // Return empty string for cards without rarity in database
      };

      // Map NFT reservations
      const reservationsFromReservations = reservationsResult.rows.map((row: any) => ({
        id: `res_${row.id}`,
        nftTitle: cleanTitle(row.nft_title),
        nftType: row.nft_type,
        rarity: getRarity(row.rarity),
        level: row.level,
        collectionName: row.collection_name,
        description: row.description,
        metadataUri: row.metadata_uri,
        imageUrl: getImageUrl(row.nft_type, row.collection_name, row.level) || row.image_url,
        status: row.status,
        voucherId: row.voucher_id,
        voucherExpiry: row.voucher_expiry,
        objectId: row.object_id,
        transactionDigest: row.transaction_digest,
        createdAt: row.created_at,
        mintedAt: row.minted_at,
      }));

      // Map NFTs from nfts table
      const reservationsFromNfts = nftsResult.rows.map((row: any) => {
        const collectionName = row.collection_name || 'Unknown Collection';
        const cardType = getCardTypeFromTitle(row.nft_title || '', row.nft_type, collectionName);
        return {
          id: `nft_${row.nft_id}`,
          nftTitle: cleanTitle(row.nft_title || 'Unknown NFT'),
          nftType: cardType,
          rarity: getRarity(row.rarity),
          level: extractMintNumber(row.nft_serial_number), // nft_serial_number = mint number
          cardLevel: extractCardLevel(row.m_level), // m_level = card level (for future use)
          collectionName: collectionName,
          description: row.nft_description || '',
          metadataUri: null,
          imageUrl: getImageUrl(cardType, collectionName, extractCardLevel(row.m_level)) || null,
          status: row.status === 'minted' ? 'minted' : 'reserved',
          voucherId: null,
          voucherExpiry: null,
          objectId: null,
          transactionDigest: row.transaction_digest,
          createdAt: null,
          mintedAt: row.minted_at,
        };
      });

      // Combine both sources
      const reservations = [...reservationsFromReservations, ...reservationsFromNfts];

      // Get summary stats
      const stats = {
        total: reservations.length,
        reserved: reservations.filter(r => r.status === 'reserved').length,
        claimed: reservations.filter(r => r.status === 'claimed' || r.status === 'minted').length,
        minted: reservations.filter(r => r.status === 'minted').length,
      };

      return NextResponse.json({
        success: true,
        reservations,
        stats,
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Get reservations error:', error);
    return NextResponse.json(
      { error: 'Failed to get reservations', details: error.message },
      { status: 500 }
    );
  }
}

