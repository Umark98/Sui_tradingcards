import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';

interface CardConfig {
  cardType: string;
  objectId: string;
  version: number;
  mintSupply?: number;
  game?: string;
  description: string;
  transferability: string;
  royalty: number;
  edition?: string;
  set?: string;
  upgradeable: boolean;
  subType: string;
  season?: number;
  episodeUtility?: number;
  unlockCurrency?: string;
  levels: Array<{
    level: number;
    rarity: string;
    enhancement: string;
    mediaUrlPrimary: string;
    mediaUrlDisplay: string;
    rank: number;
    unlockThreshold?: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const config: CardConfig = await request.json();

    // Validate required fields
    if (!config.cardType || !config.objectId || !config.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to database
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert or update card configuration
      const configQuery = `
        INSERT INTO card_configurations (
          card_type, object_id, version, mint_supply, game, description,
          transferability, royalty, edition, set_name, upgradeable,
          sub_type, season, episode_utility, unlock_currency, levels
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (card_type) 
        DO UPDATE SET
          object_id = EXCLUDED.object_id,
          version = EXCLUDED.version,
          mint_supply = EXCLUDED.mint_supply,
          game = EXCLUDED.game,
          description = EXCLUDED.description,
          transferability = EXCLUDED.transferability,
          royalty = EXCLUDED.royalty,
          edition = EXCLUDED.edition,
          set_name = EXCLUDED.set_name,
          upgradeable = EXCLUDED.upgradeable,
          sub_type = EXCLUDED.sub_type,
          season = EXCLUDED.season,
          episode_utility = EXCLUDED.episode_utility,
          unlock_currency = EXCLUDED.unlock_currency,
          levels = EXCLUDED.levels,
          updated_at = CURRENT_TIMESTAMP
      `;

      await client.query(configQuery, [
        config.cardType,
        config.objectId,
        config.version,
        config.mintSupply,
        config.game,
        config.description,
        config.transferability,
        config.royalty,
        config.edition,
        config.set,
        config.upgradeable,
        config.subType,
        config.season,
        config.episodeUtility,
        config.unlockCurrency,
        JSON.stringify(config.levels)
      ]);

      await client.query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        message: 'Configuration saved successfully' 
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error saving card configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          card_type, object_id, version, mint_supply, game, description,
          transferability, royalty, edition, set_name, upgradeable,
          sub_type, season, episode_utility, unlock_currency, levels,
          created_at, updated_at
        FROM card_configurations
        ORDER BY card_type
      `);

      const configurations = result.rows.map((row: any) => ({
        cardType: row.card_type,
        objectId: row.object_id,
        version: row.version,
        mintSupply: row.mint_supply,
        game: row.game,
        description: row.description,
        transferability: row.transferability,
        royalty: row.royalty,
        edition: row.edition,
        set: row.set_name,
        upgradeable: row.upgradeable,
        subType: row.sub_type,
        season: row.season,
        episodeUtility: row.episode_utility,
        unlockCurrency: row.unlock_currency,
        levels: JSON.parse(row.levels),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

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

