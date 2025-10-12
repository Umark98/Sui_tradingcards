// Collect (mint) NFTs with voucher
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/service/pool';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { restoreKeypair } from '@/utils/walletUtils';
import { generateSignedVoucher, isVoucherExpired } from '@/utils/voucherUtils';

// Sui client configuration
const suiClient = new SuiClient({
  url: process.env.NEXT_PUBLIC_SUI_NETWORK_URL || 'https://fullnode.testnet.sui.io:443',
});

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
      // Get user from existing users table with wallet info
      const userResult = await client.query(
        'SELECT user_id, user_email, wallet_address, wallet_private_key FROM users WHERE user_email = $1',
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

      // Get user's NFTs (exclude Moments, only available NFTs)
      const reservationsResult = await client.query(
        `SELECT 
          n.nft_id as id,
          n.nft_title,
          nt.type_name as nft_type,
          n.rarity,
          n.m_level as level,
          n.edition_size,
          n.status,
          a.name as artist,
          c.name as collection_name,
          p.name as platform,
          n.nft_description
         FROM nfts n
         LEFT JOIN nft_types nt ON n.type_id = nt.type_id
         LEFT JOIN artists a ON n.artist_id = a.artist_id
         LEFT JOIN collections c ON n.collection_id = c.collection_id
         LEFT JOIN platforms p ON c.platform_id = p.platform_id
         WHERE n.nft_id = ANY($1) 
           AND n.user_id = $2
           AND c.name != 'Moments'
           AND (n.status IS NULL OR n.status != 'collected')`,
        [reservationIds, user.user_id]
      );

      if (reservationsResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'No valid reservations found' },
          { status: 404 }
        );
      }

      const results = [];
      const errors = [];

      // Get admin wallet for signing (your wallet from admin panel)
      const adminKeypair = restoreKeypair();
      if (!adminKeypair) {
        return NextResponse.json(
          { error: 'Admin wallet not configured' },
          { status: 500 }
        );
      }

      // Process each NFT collection
      for (const nft of reservationsResult.rows) {
        try {
          // Determine which contract to use based on collection
          let contractModule = '';
          let cardType = '';
          
          if (nft.collection_name === 'Genesis') {
            contractModule = 'trading_card_genesis';
            // Map NFT title to card type
            if (nft.nft_title.includes('Commemorative Card #1')) cardType = 'CommemorativeCard1';
            else if (nft.nft_title.includes('Commemorative Card #2')) cardType = 'CommemorativeCard2';
            else if (nft.nft_title.includes('Commemorative Card #3')) cardType = 'CommemorativeCard3';
            else if (nft.nft_title.includes('Commemorative Card #4')) cardType = 'CommemorativeCard4';
            else {
              errors.push({
                reservationId: nft.id,
                error: `Unknown Genesis card type: ${nft.nft_title}`,
              });
              continue;
            }
          } else if (nft.collection_name === 'Missions') {
            contractModule = 'genesis_missoncards';
            // Map Mission titles to card types
            if (nft.nft_title.includes('Singapore')) cardType = 'MissionSingapore';
            else if (nft.nft_title.includes('Transylvania')) {
              if (nft.nft_title.includes('Signed')) cardType = 'MissionTransylvaniaSigned';
              else cardType = 'MissionTransylvania';
            } else {
              errors.push({
                reservationId: nft.id,
                error: `Unknown Mission card type: ${nft.nft_title}`,
              });
              continue;
            }
          } else if (nft.collection_name === 'Gadgets') {
            contractModule = 'trading_card';
            // Map Gadget titles to card types (you'll need to add these mappings)
            // For now, we'll use a generic approach based on the title
            const gadgetName = nft.nft_title.replace(/[^a-zA-Z0-9]/g, '');
            cardType = gadgetName || 'Brella'; // Default to Brella if no name
            
            // You may need to add specific mappings here based on your contract
            errors.push({
              reservationId: nft.id,
              error: `Gadget card minting not yet configured. Please contact admin.`,
            });
            continue;
          } else {
            errors.push({
              reservationId: nft.id,
              error: `Collection ${nft.collection_name} not supported for minting`,
            });
            continue;
          }

          // Generate a unique mint number
          const mintNumber = Date.now() + Math.floor(Math.random() * 1000);

          // Create and sign transaction using admin wallet
          const txb = new TransactionBlock();
          
          // Mint to user's custodial wallet address
          const recipientAddress = user.wallet_address;
          
          // Get AdminCap object ID from environment
          const adminCapId = process.env.ADMIN_CAP_ID;
          if (!adminCapId) {
            throw new Error('ADMIN_CAP_ID not configured in environment');
          }

          // Call the appropriate mint function
          txb.moveCall({
            target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::${contractModule}::mint_and_transfer`,
            typeArguments: [`${process.env.NEXT_PUBLIC_PACKAGE_ID}::${contractModule}::${cardType}`],
            arguments: [
              txb.object(adminCapId), // AdminCap
              txb.pure(mintNumber, 'u64'), // mint_number
              txb.pure(recipientAddress, 'address'), // recipient (user's custodial wallet)
            ],
          });

          // Sign and execute transaction with admin wallet
          const result = await suiClient.signAndExecuteTransactionBlock({
            transactionBlock: txb,
            signer: adminKeypair,
            options: {
              showEffects: true,
              showObjectChanges: true,
            },
          });

          // Update NFT record with transaction details
          await client.query(
            `UPDATE nfts 
             SET transaction_digest = $1, 
                 mint_number = $2,
                 minted_at = CURRENT_TIMESTAMP,
                 status = 'collected'
             WHERE nft_id = $3`,
            [result.digest, mintNumber, nft.id]
          );

          results.push({
            reservationId: nft.id,
            nftTitle: nft.nft_title,
            collectionName: nft.collection_name,
            objectId: result.objectChanges?.[0]?.objectId || 'N/A',
            transactionDigest: result.digest,
            mintNumber: mintNumber,
            status: 'success',
          });

        } catch (error: any) {
          console.error(`Error collecting NFT ${nft.id}:`, error);
          errors.push({
            reservationId: nft.id,
            error: error.message,
          });
        }
      }

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

