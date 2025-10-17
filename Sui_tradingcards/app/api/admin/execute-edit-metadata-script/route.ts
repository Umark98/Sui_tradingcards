import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface ScriptExecutionRequest {
  cardType: string;
  metadataObjectId: string;
  version: number;
  keys: number[];
  game?: string;
  description: string;
  rarityValues: string[];
  enhancementValues: string[];
  episodeUtility?: number;
  transferability: string;
  royalty: number;
  unlockCurrency?: string;
  unlockThresholdValues: number[];
  edition?: string;
  set?: string;
  upgradeable: boolean;
  mediaUrlsPrimaryValues: string[];
  mediaUrlsDisplayValues: string[];
  rankValues: number[];
  subType: string;
  season?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScriptExecutionRequest = await request.json();
    
    console.log('Execute edit metadata script request received:', {
      cardType: body.cardType,
      metadataObjectId: body.metadataObjectId,
      version: body.version,
      description: body.description
    });

    // Validate required fields
    if (!body.cardType || !body.metadataObjectId || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: cardType, metadataObjectId, description' },
        { status: 400 }
      );
    }

    // Execute the edit metadata script directly using the existing script
    return new Promise((resolve) => {
      const setupDir = path.join(process.cwd(), '..', 'blockchain-contracts', 'setup');
      
      // Set environment variables for the script
      const env = {
        ...process.env,
        CARD_TYPE: body.cardType,
        METADATA_OBJECT_ID: body.metadataObjectId,
        VERSION: body.version.toString(),
        GAME: body.game || '',
        DESCRIPTION: body.description,
        RARITY_VALUES: JSON.stringify(body.rarityValues),
        ENHANCEMENT_VALUES: JSON.stringify(body.enhancementValues),
        EPISODE_UTILITY: body.episodeUtility?.toString() || '',
        TRANSFERABILITY: body.transferability,
        ROYALTY: body.royalty.toString(),
        UNLOCK_CURRENCY: body.unlockCurrency || '',
        UNLOCK_THRESHOLD_VALUES: JSON.stringify(body.unlockThresholdValues),
        EDITION: body.edition || '',
        SET: body.set || '',
        UPGRADEABLE: body.upgradeable.toString(),
        MEDIA_URLS_PRIMARY_VALUES: JSON.stringify(body.mediaUrlsPrimaryValues),
        MEDIA_URLS_DISPLAY_VALUES: JSON.stringify(body.mediaUrlsDisplayValues),
        RANK_VALUES: JSON.stringify(body.rankValues),
        SUB_TYPE: body.subType,
        SEASON: body.season?.toString() || '',
        KEYS: JSON.stringify(body.keys)
      };

      const child = spawn('npm', ['run', 'edit-metadata'], {
        cwd: setupDir,
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            output: stdout,
            message: 'Edit metadata script executed successfully'
          }));
        } else {
          resolve(NextResponse.json({
            error: 'Script execution failed',
            details: stderr,
            output: stdout
          }, { status: 400 }));
        }
      });

      child.on('error', (error) => {
        resolve(NextResponse.json({
          error: 'Failed to execute script',
          details: error.message
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Error in execute edit metadata script API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
