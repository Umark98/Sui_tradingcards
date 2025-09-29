import { NextResponse } from 'next/server';
import pool from '@/service/pool';

export async function GET(request: Request) {
  try {
    const client = await pool.connect();
    
    try {
      // Get query parameters for filtering
      const url = new URL(request.url);
      const rarity = url.searchParams.get('rarity');
      const level = url.searchParams.get('level');
      const collection = url.searchParams.get('collection');

      // Build the WHERE clause based on filters
      let whereClause = "WHERE n.nft_title IS NOT NULL AND n.nft_title != ''";
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (rarity) {
        whereClause += ` AND nr.rarity_name = $${paramIndex}`;
        queryParams.push(rarity);
        paramIndex++;
      }

      if (level) {
        whereClause += ` AND nml.level_value = $${paramIndex}`;
        queryParams.push(parseInt(level));
        paramIndex++;
      }

      if (collection) {
        whereClause += ` AND c.name = $${paramIndex}`;
        queryParams.push(collection);
        paramIndex++;
      }

      // Get individual NFT titles and their configurations with collection information
      const result = await client.query(`
        SELECT 
          n.nft_title,
          nt.type_id,
          nt.type_name,
          c.name as collection_name,
          nr.rarity_name,
          nml.level_value,
          COUNT(n.nft_id) as total_nfts,
          COUNT(DISTINCT n.user_id) as unique_owners
        FROM nfts n
        LEFT JOIN nft_types nt ON n.type_id = nt.type_id
        LEFT JOIN collections c ON n.collection_id = c.collection_id
        LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
        LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
        ${whereClause}
        GROUP BY n.nft_title, nt.type_id, nt.type_name, c.name, nr.rarity_name, nml.level_value
        ORDER BY total_nfts DESC
      `, queryParams);

      const configurations = result.rows.map((row: any) => {
        // Use the individual NFT title as the card type, with collection info for context
        let cardType = row.nft_title;
        let description = `${row.nft_title}`;
        
        // Add collection context for better understanding
        if (row.collection_name) {
          description += ` (${row.collection_name} Collection)`;
        }
        
        // Special handling for collector's edition types
        if (row.type_name === "Collector's Edition" || row.type_name === "Collectors Edition") {
          if (row.collection_name) {
            description = `${row.nft_title} - ${row.collection_name} Series`;
          }
        }

        return {
          cardType,
          objectId: `nft_${row.nft_title.replace(/[^a-zA-Z0-9]/g, '_')}_${row.collection_name || 'default'}_${row.rarity_name || 'unknown'}_${row.level_value || 'unknown'}`,
          version: 1,
          mintSupply: row.total_nfts,
          game: 'Inspector Gadget',
          description,
          transferability: 'Platform',
          royalty: 0,
          edition: row.collection_name === 'Genesis' ? 'Genesis Edition' : 'Original',
          set: row.collection_name || 'Inspector Gadget Collection',
          upgradeable: true,
          subType: 'NFT',
          season: row.collection_name === 'Genesis' ? 1 : null,
          episodeUtility: null,
          unlockCurrency: null,
          collectionName: row.collection_name,
          nftTitle: row.nft_title,
          rarity: row.rarity_name,
          level: row.level_value,
          levels: [
            { level: 1, rarity: 'Common', enhancement: 'Basic', mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 1 },
            { level: 2, rarity: 'Uncommon', enhancement: 'Enhanced', mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 2 },
            { level: 3, rarity: 'Rare', enhancement: 'Advanced', mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 3 },
            { level: 4, rarity: 'Epic', enhancement: 'Superior', mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 4 },
            { level: 5, rarity: 'Legendary', enhancement: 'Legendary', mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 5 }
          ]
        };
      });

      return NextResponse.json(configurations);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching card configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}

