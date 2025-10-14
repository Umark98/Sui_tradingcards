// Collect (mint) NFTs from user portal
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';
import * as fs from 'fs';
import * as path from 'path';

// Sui client configuration
const SUI_NETWORK = getFullnodeUrl(process.env.SUI_NETWORK || 'testnet');
const suiClient = new SuiClient({ url: SUI_NETWORK });

export async function POST(request: NextRequest) {
  try {
    const { email, reservationIds } = await request.json();

    if (!email || !reservationIds || !Array.isArray(reservationIds)) {
      return NextResponse.json(
        { error: 'Email and array of reservation IDs are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get user from users table with their custodial wallet
      const userResult = await client.query(
        'SELECT user_id, user_email, wallet_address FROM users WHERE user_email = $1',
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      if (!user.wallet_address) {
        return NextResponse.json(
          { error: 'User wallet not found. Please contact support.' },
          { status: 400 }
        );
      }

      // Separate nft_reservations IDs from nfts table IDs
      const reservationIds_numeric = [];
      const nftIds_numeric = [];
      
      for (const id of reservationIds) {
        if (typeof id === 'string' && id.startsWith('res_')) {
          reservationIds_numeric.push(parseInt(id.replace('res_', '')));
        } else if (typeof id === 'string' && id.startsWith('nft_')) {
          nftIds_numeric.push(parseInt(id.replace('nft_', '')));
        } else if (typeof id === 'number') {
          nftIds_numeric.push(id);
        }
      }
      
      console.log('Looking for reservations:', { 
        reservationIds, 
        reservationIds_numeric, 
        nftIds_numeric, 
        email: email.toLowerCase() 
      });
      
      // Get NFT reservations from nft_reservations table
      let reservationsFromReservations = [];
      if (reservationIds_numeric.length > 0) {
        const reservationsResult = await client.query(
          `SELECT 
            id,
            nft_title,
            nft_type,
            rarity,
            level,
            collection_name,
            description,
            status
           FROM nft_reservations
           WHERE id = ANY($1) 
             AND email = $2
             AND status = 'reserved'`,
          [reservationIds_numeric, email.toLowerCase()]
        );
        reservationsFromReservations = reservationsResult.rows;
      }
      
      // Get NFTs from nfts table
      let reservationsFromNfts = [];
      if (nftIds_numeric.length > 0) {
        const nftsResult = await client.query(
          `SELECT 
            n.nft_id as id,
            n.nft_title,
            n.nft_serial_number,
            n.m_level,
            nt.type_name as nft_type,
            c.name as collection_name,
            n.nft_description as description,
            n.status
           FROM nfts n
           LEFT JOIN nft_types nt ON n.type_id = nt.type_id
           LEFT JOIN collections c ON n.collection_id = c.collection_id
           WHERE n.nft_id = ANY($1) 
             AND n.user_id = (SELECT user_id FROM users WHERE user_email = $2)
             AND n.status = 'available'`,
          [nftIds_numeric, email.toLowerCase()]
        );
        reservationsFromNfts = nftsResult.rows;
      }
      
      // Combine both results
      const reservationsResult = { rows: [...reservationsFromReservations, ...reservationsFromNfts] };

      console.log('Found reservations:', reservationsResult.rows.length);

      if (reservationsResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'No valid reservations found' },
          { status: 404 }
        );
      }

      const results = [];
      const errors = [];

      // Get admin wallet for signing
      const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
      if (!adminPrivateKey) {
        return NextResponse.json(
          { error: 'Admin wallet not configured' },
          { status: 500 }
        );
      }

      // Decode private key and remove the first byte (flag byte)
      const privateKeyBytes = fromB64(adminPrivateKey);
      const secretKey = privateKeyBytes.slice(1); // Remove flag byte, keep only 32 bytes
      const adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);

      // Get package and admin cap from env
      const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
      const adminCapId = process.env.ADMIN_CAP_ID;
      
      if (!packageId || !adminCapId) {
        return NextResponse.json(
          { error: 'Smart contract configuration missing' },
          { status: 500 }
        );
      }

      // Helper function to extract card type from title
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
        
        return nftType || 'Unknown';
      };

      // Process each NFT reservation
      for (const reservation of reservationsResult.rows) {
        try {
          let cardType = reservation.nft_type; // CommemorativeCard1, MissionParisRare, etc.
          let mintNumber = reservation.level; // For nft_reservations, this is the mint_number
          let collectionName = reservation.collection_name; // 'Genesis Cards' or 'Missions'
          
          // For NFTs from the nfts table, use nft_serial_number as mint number
          if (reservation.nft_serial_number) {
            mintNumber = parseInt(reservation.nft_serial_number);
            // Extract correct card type from title for Genesis and Mission cards
            cardType = getCardTypeFromTitle(reservation.nft_title, reservation.nft_type, collectionName);
          }
          
          console.log(`Minting ${cardType} #${mintNumber} for ${user.wallet_address}`);

          // Determine contract module based on collection
          let contractModule = '';
          let validTypes: string[] = [];
          let requiresMetadata = false;
          
          if (collectionName === 'Genesis' || collectionName === 'Genesis Cards') {
            contractModule = 'trading_card_genesis';
            validTypes = ['CommemorativeCard1', 'CommemorativeCard2', 'CommemorativeCard3', 'CommemorativeCard4'];
            requiresMetadata = false;
          } else if (collectionName === 'Missions') {
            contractModule = 'genesis_missoncards';
            validTypes = [
              'MissionParisRare', 'MissionParisEpic', 'MissionParisLegendary', 'MissionParisUltraCommon', 'MissionParisUltraCommonSigned',
              'MissionDublinSuperLegendary', 'MissionDublinLegendary', 'MissionDublinEpic', 'MissionDublinRare', 'MissionDublinUltraCommonSigned', 'MissionDublinUltraCommon',
              'MissionNewYorkCityUltraCommon', 'MissionNewYorkCityLegendary', 'MissionNewYorkCityEpic', 'MissionNewYorkCityRare', 'MissionNewYorkCityUltraCommonSigned',
              'MissionSydneyUltraCommon', 'MissionSydneyUltraCommonSigned', 'MissionSydneyRare', 'MissionSydneyEpic', 'MissionSydneyLegendary',
              'MissionSanDiegoUltraCommon', 'MissionSanDiegoUltraCommonSigned', 'MissionSanDiegoRare', 'MissionSanDiegoEpic', 'MissionSanDiegoLegendary',
              'MissionSingaporeUltraCommon', 'MissionTransylvaniaUltraCommon', 'MissionTransylvaniaUltraCommonSigned'
            ];
            requiresMetadata = false;
          } else if (collectionName === 'Gadgets') {
            contractModule = 'gadget_gameplay_items';
            requiresMetadata = true;
            // Gadget card types will be validated dynamically based on metadata availability
            validTypes = []; // Will check metadata existence instead
          } else if (collectionName === 'Moments' || collectionName === 'Brain Train Tickets') {
            // These collections need contract investigation
            errors.push({
              reservationId: reservation.id,
              nftTitle: reservation.nft_title,
              error: `${collectionName} collection minting not yet supported in portal`,
            });
            continue;
          } else {
            errors.push({
              reservationId: reservation.id,
              nftTitle: reservation.nft_title,
              error: `Unsupported collection: ${collectionName}`,
            });
            continue;
          }

          // Validate card type (skip for Gadgets as we'll check metadata)
          if (validTypes.length > 0 && !validTypes.includes(cardType)) {
            errors.push({
              reservationId: reservation.id,
              nftTitle: reservation.nft_title,
              error: `Invalid card type: ${cardType} for collection ${collectionName}`,
            });
            continue;
          }

          // Create transaction for minting
          const tx = new Transaction();
          
          // Set gas budget
          tx.setGasBudget(100000000); // 0.1 SUI for complex transactions
          
          // Handle Gadgets differently (requires metadata)
          if (requiresMetadata) {
            // Load metadata IDs from frontend-metadata-ids.json
            const metadataPath = path.join(process.cwd(), 'public', 'frontend-metadata-ids.json');
            let metadataIds: any = {};
            try {
              if (fs.existsSync(metadataPath)) {
                metadataIds = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
              }
            } catch (error) {
              console.error('Error loading metadata IDs:', error);
            }

            // Get metadata object ID for this card type
            const metadataInfo = metadataIds[cardType];
            if (!metadataInfo || !metadataInfo.objectId) {
              errors.push({
                reservationId: reservation.id,
                nftTitle: reservation.nft_title,
                error: `Metadata not found for ${cardType}. Please create metadata first in admin panel.`,
              });
              continue;
            }

            const metadataObjectId = metadataInfo.objectId;
            const cardLevel = reservation.m_level ? parseInt(reservation.m_level) : 1;
            const metadataId = metadataObjectId; // Use the metadata object ID as the metadata ID

            console.log(`Minting Gadget ${cardType} Level ${cardLevel} #${mintNumber} with metadata ${metadataObjectId}`);

            // Call gadget mint_and_transfer function
            // Function signature: mint_and_transfer<T>(AdminCap, &mut Metadata<T>, title: String, level: u16, metadata: ID, minted_number: u64, recipient: address)
            tx.moveCall({
              target: `${packageId}::${contractModule}::mint_and_transfer`,
              typeArguments: [`${packageId}::gadget_gameplay_items::TradingCard<${packageId}::gadget_gameplay_items_titles::${cardType}>`],
              arguments: [
                tx.object(adminCapId),
                tx.object(metadataObjectId), // metadata object (mutable reference)
                tx.pure.string(reservation.nft_title || cardType), // title
                tx.pure.u16(cardLevel), // level
                tx.pure.id(metadataId), // metadata ID
                tx.pure.u64(mintNumber), // minted_number
                tx.pure.address(user.wallet_address), // recipient
              ],
            });
          } else {
            // Genesis and Mission cards (simple mint_and_transfer)
            tx.moveCall({
              target: `${packageId}::${contractModule}::mint_and_transfer`,
              typeArguments: [`${packageId}::${contractModule}::${cardType}`],
              arguments: [
                tx.object(adminCapId),
                tx.pure.u64(mintNumber),
                tx.pure.address(user.wallet_address),
              ],
            });
          }

          // Sign and execute transaction
          const result = await suiClient.signAndExecuteTransaction({
            transaction: tx,
            signer: adminKeypair,
            options: {
              showEffects: true,
              showObjectChanges: true,
            },
          });

          // Check transaction success
          if (result.effects?.status?.status !== 'success') {
            throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
          }

          // Find the created NFT object
          const createdObject = result.effects?.created?.[0];
          const objectId = createdObject?.reference?.objectId || null;

          console.log(`✓ Minted ${collectionName} - ${cardType} #${mintNumber} - ObjectID: ${objectId}`);

          // Update reservation/NFT status
          if (reservation.nft_serial_number) {
            // This is from the nfts table - update the nfts table
            await client.query(
              `UPDATE nfts 
               SET status = 'minted',
                   transaction_digest = $1,
                   minted_at = CURRENT_TIMESTAMP
               WHERE nft_id = $2`,
              [result.digest, reservation.id]
            );
          } else {
            // This is from nft_reservations table - update the reservations table
            await client.query(
              `UPDATE nft_reservations 
               SET status = 'minted',
                   object_id = $1,
                   transaction_digest = $2,
                   minted_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [objectId, result.digest, reservation.id]
            );
          }

          results.push({
            reservationId: reservation.id,
            nftTitle: reservation.nft_title,
            collection: collectionName,
            cardType: cardType,
            mintNumber: mintNumber,
            objectId: objectId,
            transactionDigest: result.digest,
            status: 'success',
          });

        } catch (error: any) {
          console.error(`Error minting NFT ${reservation.id}:`, error);
          errors.push({
            reservationId: reservation.id,
            nftTitle: reservation.nft_title,
            error: error.message,
          });
        }
      }

      console.log('Minting complete:', { successCount: results.length, errorCount: errors.length });
      console.log('Errors:', errors);

      return NextResponse.json({
        success: results.length > 0,
        message: `Successfully collected ${results.length} NFT(s)`,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Collect NFTs error:', error);
    return NextResponse.json(
      { error: 'Failed to collect NFTs', details: error.message },
      { status: 500 }
    );
  }
}

