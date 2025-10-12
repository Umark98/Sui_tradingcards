import { NextResponse } from 'next/server';
import pool from '@/service/pool';

// All 165 gadget types extracted from the Move contract
const GADGET_TYPES = [
    'TopSecretGadgetPhone', 'Brella', 'Mallet', 'Legs', 'Hand', 'Arms', 'Neck', 'RightArm', 'Copter', 'Skates',
    'Coat', 'LeftArm', 'Binoculars', 'RedMagnifyingGlass', 'Emergency', 'Flashlight', 'Key', 'Laser', 'LeftCuff',
    'LeftEar', 'Phone', 'RightCuff', 'RightLeg', 'Screwdriver', 'Skis', 'Spring', 'Tie', 'WaterGun', 'Badge',
    'BallpointPen', 'BlackMagnifyingGlass', 'Card', 'Ears', 'LeftLeg', 'MagnetShoes', 'PlasticFlySwatter',
    'RedBlowDryer', 'Respirator', 'RightEar', 'RocketSkates', 'Sail', 'SteelMagnifyingGlass', 'TwoHands',
    'Whistle', 'WhiteHandkerchief', 'WorkLight', 'YellowHandkerchief', 'AlarmClock', 'BoatPropellerFan',
    'BolloBalls', 'Daisies', 'FirecrackerSkates', 'Geraniums', 'HandheldFlashlight', 'IceSkates',
    'IdentificationPaper', 'LeftArmRetractor', 'LightBulb', 'Magnet', 'Pencil', 'Peonies', 'PinkHandkerchief',
    'RedHandleScissors', 'SafetyScissors', 'Saw', 'SeltzerBottle', 'Superbells', 'WaterCannon', 'SmallCamera',
    'NorthPoleCompass', 'PocketWatchOnChain', 'Radar', 'Shears', 'LongShovel', 'Teeth', 'Candy', 'HandOfCards',
    'Keyboard', 'Notepad', 'PoliceId', 'SpiceShaker', 'Telescope', 'AmazonFan', 'Daffodils', 'FlashbulbCamera',
    'FlightSafetyLiterature', 'Primroses', 'Pulley', 'SmallMallet', 'WeldingMask', 'BlueStripedHandkerchief',
    'DemagnetizedCompass', 'FeatherDuster', 'MapOfSouthAfrica', 'Net', 'PortableTv', 'TwoLeftCuffs',
    'BlackDuster', 'EverestIslandFan', 'LeftSkate', 'Megaphone', 'Note', 'OilCan', 'StrawHat', 'TelescopingLegs',
    'Coin', 'DistressSignalFlag', 'LeftBinocular', 'MetalFlySwatter', 'PoolTube', 'WaterSkiPropeller', 'Wrench',
    'CopterSpare', 'DeskLamp', 'EgyptFan', 'FountainPen', 'PizzaChefHat', 'PrototypeRadar', 'Scissors',
    'Toothbrush', 'BucketOfWater', 'CountDraculasHauntedCastleTouristBrochure', 'FingerprintDustingKit',
    'Flippers', 'Lighter', 'PocketWatch', 'RedCup', 'Yoyo', 'BlueBlowDryer', 'Bone', 'CarMechanicFan',
    'FishNet', 'HatTip', 'PaperFan', 'Parachute', 'PlasticFan', 'Clippers', 'FlashcubeCamera', 'HeadWheel',
    'Match', 'RightArmRetractor', 'Spoon', 'SurrenderFlag', 'TrickFlower', 'BeachShovel', 'DuckCall',
    'GadgetMobileKeys', 'GardeningShovel', 'RedDottedHandkerchief', 'RedDuster', 'WinnerFlag', 'CanOpener',
    'ChopSticks', 'Fork', 'MapOfTibet', 'PinkEnvelope', 'Roses', 'Toothpaste', 'Doll', 'FiveHands',
    'KitchenKnife', 'Pot', 'Shoehorn', 'Sponge', 'Squeegee'
];

export async function GET(request: Request) {
    try {
        const client = await pool.connect();
        
        try {
            // Get query parameters for filtering
            const url = new URL(request.url);
            const gadgetType = url.searchParams.get('gadgetType');
            const limit = url.searchParams.get('limit') || '1000';

            // Build the WHERE clause to match gadget types
            let whereClause = "WHERE n.title IN (";
            const gadgetParams = GADGET_TYPES.map((_, index) => `$${index + 1}`).join(', ');
            whereClause += gadgetParams + ")";

            // Add specific gadget type filter if provided
            if (gadgetType) {
                whereClause += ` AND n.title = $${GADGET_TYPES.length + 1}`;
            }

            // Get users who have NFTs matching gadget types
            const query = `
                SELECT 
                    u.user_id,
                    u.user_email,
                    n.nft_title,
                    n.nft_description,
                    n.nft_serial_number,
                    n.numentities,
                    n.type,
                    n.rarity,
                    n.m_level AS minted_level,
                    n.edition_size,
                    nt.type_name,
                    nr.rarity_name,
                    nml.level_value,
                    c.name AS collection_name,
                    c.series AS collection_series,
                    a.name AS artist_name,
                    a.copyright AS artist_copyright,
                    p.name AS platform_name,
                    COUNT(n.nft_id) OVER (PARTITION BY u.user_id) AS user_total_gadgets
                FROM users u
                JOIN nfts n ON u.user_id = n.user_id
                LEFT JOIN nft_types nt ON n.type_id = nt.type_id
                LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
                LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
                LEFT JOIN collections c ON n.collection_id = c.collection_id
                LEFT JOIN artists a ON n.artist_id = a.artist_id
                LEFT JOIN platforms p ON c.platform_id = p.platform_id
                ${whereClause}
                ORDER BY 
                    u.user_email ASC,
                    n.nft_title ASC,
                    nr.rarity_id ASC,
                    nml.level_value ASC
                LIMIT $${GADGET_TYPES.length + (gadgetType ? 2 : 1)}
            `;

            const params = [...GADGET_TYPES];
            if (gadgetType) {
                params.push(gadgetType);
            }
            params.push(parseInt(limit));

            const result = await client.query(query, params);

            // Get summary statistics
            const statsQuery = `
                SELECT 
                    COUNT(DISTINCT u.user_id) AS total_gadget_users,
                    COUNT(n.nft_id) AS total_gadget_nfts,
                    COUNT(DISTINCT n.nft_title) AS unique_gadget_types,
                    COUNT(DISTINCT c.name) AS unique_collections
                FROM users u
                JOIN nfts n ON u.user_id = n.user_id
                LEFT JOIN collections c ON n.collection_id = c.collection_id
                WHERE n.nft_title IN (${GADGET_TYPES.map((_, index) => `$${index + 1}`).join(', ')})
            `;

            const statsResult = await client.query(statsQuery, GADGET_TYPES);

            // Get gadget type distribution
            const distributionQuery = `
                SELECT 
                    n.nft_title,
                    COUNT(n.nft_id) AS total_nfts,
                    COUNT(DISTINCT u.user_id) AS unique_users,
                    COUNT(DISTINCT c.name) AS collections
                FROM nfts n
                JOIN users u ON n.user_id = n.user_id
                LEFT JOIN collections c ON n.collection_id = c.collection_id
                WHERE n.nft_title IN (${GADGET_TYPES.map((_, index) => `$${index + 1}`).join(', ')})
                GROUP BY n.nft_title
                ORDER BY total_nfts DESC
                LIMIT 20
            `;

            const distributionResult = await client.query(distributionQuery, GADGET_TYPES);

            // Get top gadget users
            const topUsersQuery = `
                SELECT 
                    u.user_id,
                    u.user_email,
                    COUNT(n.nft_id) AS gadget_count,
                    COUNT(DISTINCT n.nft_title) AS unique_gadget_types,
                    STRING_AGG(DISTINCT n.nft_title, ', ') AS gadget_types
                FROM users u
                JOIN nfts n ON u.user_id = n.user_id
                WHERE n.nft_title IN (${GADGET_TYPES.map((_, index) => `$${index + 1}`).join(', ')})
                GROUP BY u.user_id, u.user_email
                ORDER BY gadget_count DESC
                LIMIT 10
            `;

            const topUsersResult = await client.query(topUsersQuery, GADGET_TYPES);

            const gadgetUsers = result.rows.map((row: any) => ({
                userId: row.user_id,
                userEmail: row.user_email,
                nftTitle: row.nft_title,
                nftDescription: row.nft_description,
                nftSerialNumber: row.nft_serial_number,
                numEntities: row.numentities,
                type: row.type,
                rarity: row.rarity,
                mintedLevel: row.minted_level,
                editionSize: row.edition_size,
                typeName: row.type_name,
                rarityName: row.rarity_name,
                levelValue: row.level_value,
                collectionName: row.collection_name,
                collectionSeries: row.collection_series,
                artistName: row.artist_name,
                artistCopyright: row.artist_copyright,
                platformName: row.platform_name,
                userTotalGadgets: parseInt(row.user_total_gadgets)
            }));

            const stats = {
                totalGadgetUsers: parseInt(statsResult.rows[0].total_gadget_users),
                totalGadgetNfts: parseInt(statsResult.rows[0].total_gadget_nfts),
                uniqueGadgetTypes: parseInt(statsResult.rows[0].unique_gadget_types),
                uniqueCollections: parseInt(statsResult.rows[0].unique_collections)
            };

            const distribution = distributionResult.rows.map((row: any) => ({
                gadgetType: row.nft_title,
                totalNfts: parseInt(row.total_nfts),
                uniqueUsers: parseInt(row.unique_users),
                collections: parseInt(row.collections)
            }));

            const topUsers = topUsersResult.rows.map((row: any) => ({
                userId: row.user_id,
                userEmail: row.user_email,
                gadgetCount: parseInt(row.gadget_count),
                uniqueGadgetTypes: parseInt(row.unique_gadget_types),
                gadgetTypes: row.gadget_types
            }));

            return NextResponse.json({
                success: true,
                stats,
                distribution,
                topUsers,
                gadgetUsers,
                filters: {
                    gadgetType,
                    limit: parseInt(limit)
                },
                totalResults: gadgetUsers.length,
                availableGadgetTypes: GADGET_TYPES
            });

        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Error fetching gadget users:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to fetch gadget users', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}
