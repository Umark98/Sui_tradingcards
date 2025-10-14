// Get user's NFT reservations
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';
import { metadataCache } from '@/utils/metadataCache';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000); // Max 1000 per request
    const offset = (page - 1) * limit;

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

      // Get total count for pagination
      const countResult = await client.query(
        `SELECT 
          (SELECT COUNT(*) FROM nft_reservations WHERE email = $1) +
          (SELECT COUNT(*) FROM nfts WHERE user_id = $2) as total_count`,
        [normalizedEmail, user.user_id]
      );
      const totalCount = parseInt(countResult.rows[0]?.total_count || '0');

      // Get user's NFT reservations from nft_reservations table (paginated)
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
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [normalizedEmail, limit, offset]
      );

      // Calculate remaining limit for NFTs query
      const reservationsCount = reservationsResult.rows.length;
      const nftsLimit = Math.max(0, limit - reservationsCount);
      const nftsOffset = Math.max(0, offset - reservationsCount);

      // Get user's NFTs from the nfts table (paginated)
      let nftsResult = { rows: [] };
      if (nftsLimit > 0) {
        nftsResult = await client.query(
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
           ORDER BY n.nft_id DESC
           LIMIT $2 OFFSET $3`,
          [user.user_id, nftsLimit, nftsOffset]
        );
      }

      // Load metadata from cache (fast, production-ready)
      const displayImages = metadataCache.loadDisplayImages();
      const gadgetMetadata = metadataCache.loadGadgetMetadata();
      
      // Only log in development
      if (!IS_PRODUCTION) {
        console.log('📦 Cached display images:', Object.keys(displayImages).length, 'types');
        console.log('📦 Cached gadget metadata:', Object.keys(gadgetMetadata).length, 'types');
      }
      
      // Helper function to get image URL for a card type and level
      const getImageUrl = (cardType: string, collectionName: string, level?: number): string | null => {
        // For Gadgets, ONLY show image if level-specific image exists
        if (collectionName === 'Gadgets' && gadgetMetadata[cardType]) {
          const metadata = gadgetMetadata[cardType];
          
          // ONLY return image if level-specific image exists
          if (level && metadata.levelImages && metadata.levelImages[level]) {
            return metadata.levelImages[level];
          }
          
          // If level doesn't have an image, return null (no image)
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

      // Get summary stats from database (not from paginated results)
      const statsResult = await client.query(
        `SELECT 
          (SELECT COUNT(*) FROM nft_reservations WHERE email = $1) +
          (SELECT COUNT(*) FROM nfts WHERE user_id = $2) as total,
          (SELECT COUNT(*) FROM nft_reservations WHERE email = $1 AND status = 'reserved') +
          (SELECT COUNT(*) FROM nfts WHERE user_id = $2 AND status IN ('reserved', 'available')) as reserved,
          (SELECT COUNT(*) FROM nft_reservations WHERE email = $1 AND status IN ('claimed', 'minted')) +
          (SELECT COUNT(*) FROM nfts WHERE user_id = $2 AND status = 'minted') as claimed`,
        [normalizedEmail, user.user_id]
      );

      // Get category breakdown stats
      const categoryStatsResult = await client.query(
        `SELECT 
          collection_name,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('reserved', 'available')) as available,
          COUNT(*) FILTER (WHERE status = 'minted') as collected
        FROM (
          SELECT collection_name, status FROM nft_reservations WHERE email = $1
          UNION ALL
          SELECT c.name as collection_name, n.status 
          FROM nfts n
          LEFT JOIN collections c ON n.collection_id = c.collection_id
          WHERE n.user_id = $2
        ) combined
        GROUP BY collection_name
        ORDER BY collection_name`,
        [normalizedEmail, user.user_id]
      );

      const categoryStats: Record<string, { total: number; available: number; collected: number }> = {};
      categoryStatsResult.rows.forEach((row: any) => {
        categoryStats[row.collection_name] = {
          total: parseInt(row.total || '0'),
          available: parseInt(row.available || '0'),
          collected: parseInt(row.collected || '0'),
        };
      });

      const stats = {
        total: parseInt(statsResult.rows[0]?.total || '0'),
        reserved: parseInt(statsResult.rows[0]?.reserved || '0'),
        claimed: parseInt(statsResult.rows[0]?.claimed || '0'),
        minted: parseInt(statsResult.rows[0]?.claimed || '0'),
        byCategory: categoryStats,
      };

      // Pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return NextResponse.json({
        success: true,
        reservations,
        stats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    // Always log errors, but with different detail levels
    if (IS_PRODUCTION) {
      console.error('❌ Reservations API error:', error.message);
    } else {
      console.error('❌ Get reservations error:', error);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get reservations', 
        details: IS_PRODUCTION ? 'Internal server error' : error.message 
      },
      { status: 500 }
    );
  }
}

