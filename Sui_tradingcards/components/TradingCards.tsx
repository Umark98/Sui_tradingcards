"use client";

import { useWalletKit } from '@mysten/wallet-kit';
import { useState, useEffect } from 'react';

interface TradingCard {
  objectId: string;
  title: string;
  level: number;
  rank: number;
  rarity: string;
  enhancement: string;
  mediaUrlPrimary: string;
  mediaUrlDisplay: string;
  metadata: string;
  mintNumber: number;
  type: string;
}

interface TradingCardMetadata {
  version: number;
  mintSupply?: number;
  currentSupply: number;
  game?: string;
  description: string;
  rarity: Record<number, string>;
  enhancements: Record<number, string>;
  episodeUtility?: number;
  transferability: string;
  royalty: number;
  unlockCurrency?: string;
  unlockThreshold: Record<number, number>;
  edition?: string;
  set?: string;
  upgradeable: boolean;
  mediaUrlsPrimary: Record<number, string>;
  mediaUrlsDisplay: Record<number, string>;
  ranks: Record<number, number>;
  subType: string;
  season?: number;
}

export default function TradingCards() {
  const { currentAccount } = useWalletKit();
  const [cards, setCards] = useState<TradingCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector Gadget trading card types
  const INSPECTOR_GADGET_TYPES = [
    'AlarmClock', 'AmazonFan', 'Arms', 'Badge', 'BallpointPen', 'BeachShovel',
    'Binoculars', 'BlackDuster', 'BlackMagnifyingGlass', 'BlueBlowDryer',
    'BlueStripedHandkerchief', 'BoatPropellerFan', 'BolloBalls', 'Bone',
    'Brella', 'BucketOfWater', 'CanOpener', 'Candy', 'Card', 'CarMechanicFan',
    'ChopSticks', 'Clippers', 'Coat', 'Coin', 'Copter', 'CopterSpare',
    'CountDraculasHauntedCastleTouristBrochure', 'Daffodils', 'Daisies',
    'DemagnetizedCompass', 'DeskLamp', 'DistressSignalFlag', 'Doll',
    'DuckCall', 'Ears', 'EgyptFan', 'Emergency', 'EverestIslandFan',
    'FeatherDuster', 'FingerprintDustingKit', 'FirecrackerSkates',
    'FishNet', 'FiveHands', 'FlashbulbCamera', 'FlashcubeCamera',
    'Flashlight', 'FlightSafetyLiterature', 'Flippers', 'Fork',
    'FountainPen', 'GadgetMobileKeys', 'GardeningShovel', 'Geraniums',
    'Hand', 'HandOfCards', 'HandheldFlashlight', 'HatTip', 'HeadWheel',
    'IceSkates', 'IdentificationPaper', 'Key', 'Keyboard', 'KitchenKnife',
    'Laser', 'LeftArm', 'LeftArmRetractor', 'LeftBinocular', 'LeftCuff',
    'LeftEar', 'LeftLeg', 'LeftSkate', 'LightBulb', 'Lighter', 'LongShovel',
    'Magnet', 'MagnetShoes', 'Mallet', 'MapOfSouthAfrica', 'MapOfTibet',
    'Match', 'Megaphone', 'MetalFlySwatter', 'Neck', 'Net',
    'NorthPoleCompass', 'Note', 'Notepad', 'OilCan', 'PaperFan',
    'Parachute', 'Pencil', 'Peonies', 'PinkEnvelope', 'PinkHandkerchief',
    'PizzaChefHat', 'PlasticFan', 'PlasticFlySwatter', 'PocketWatch',
    'PocketWatchOnChain', 'PoliceId', 'PoolTube', 'Pot', 'Primroses',
    'PrototypeRadar', 'Pulley', 'Radar', 'RedBlowDryer', 'RedCup',
    'RedDottedHandkerchief', 'RedDuster', 'RedHandleScissors',
    'RedMagnifyingGlass', 'Respirator', 'RightArm', 'RightArmRetractor',
    'RightCuff', 'RightEar', 'RightLeg', 'RocketSkates', 'Roses',
    'SafetyScissors', 'Sail', 'Saw', 'Scissors', 'Screwdriver', 'Shears',
    'Shoehorn', 'Skates', 'Skis', 'SmallCamera', 'SmallMallet', 'Sponge',
    'Spoon', 'Spring', 'Squeegee', 'SteelMagnifyingGlass', 'StrawHat',
    'SurrenderFlag', 'Superbells', 'Telescope', 'TelescopingLegs',
    'Teeth', 'Tie', 'Toothbrush', 'Toothpaste', 'TopSecretGadgetPhone',
    'TrickFlower', 'TwoHands', 'TwoLeftCuffs', 'WaterCannon',
    'WaterGun', 'WaterSkiPropeller', 'WeldingMask', 'WhiteHandkerchief',
    'WinnerFlag', 'WorkLight', 'Wrench', 'YellowHandkerchief', 'Yoyo'
  ];

  useEffect(() => {
    if (currentAccount) {
      fetchTradingCards();
    }
  }, [currentAccount]);

  const fetchTradingCards = async () => {
    if (!currentAccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all objects owned by the wallet
      const response = await fetch(`https://fullnode.testnet.sui.io`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getOwnedObjects',
          params: [
            currentAccount.address,
            {
              options: {
                showType: true,
                showOwner: true,
                showPreviousTransaction: true,
                showDisplay: true,
                showContent: true,
                showBcs: false,
                showStorageRebate: false
              }
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      
      if (data.error) {
        throw new Error(data.error.message || 'Unknown error');
      }

      // Filter for Inspector Gadget trading cards
      const objects = data.result.data || [];
      const inspectorCards: TradingCard[] = [];

      objects.forEach((obj: any) => {
        const type = obj.data?.type || obj.type || '';
        
        // Check if this is an Inspector Gadget trading card
        const isInspectorGadget = INSPECTOR_GADGET_TYPES.some(cardType => 
          type.includes(`TradingCard<${cardType}>`) || 
          type.includes(`GadgetGameplayItem<${cardType}>`)
        );

        if (isInspectorGadget && obj.data?.content?.fields) {
          const fields = obj.data.content.fields;
          inspectorCards.push({
            objectId: obj.objectId,
            title: fields.title || 'Unknown Card',
            level: parseInt(fields.level) || 0,
            rank: parseInt(fields.rank) || 0,
            rarity: fields.rarity || 'Unknown',
            enhancement: fields.enhancement || 'None',
            mediaUrlPrimary: fields.media_url_primary || '',
            mediaUrlDisplay: fields.media_url_display || '',
            metadata: fields.metadata || '',
            mintNumber: parseInt(fields.mint_number) || 0,
            type: type
          });
        }
      });

      setCards(inspectorCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trading cards');
      console.error('Error fetching trading cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-white';
      case 'uncommon': return 'bg-green-100 text-green-100';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-white';
    }
  };

  const formatObjectId = (objectId: string) => {
    if (!objectId) return '';
    return `${objectId.slice(0, 8)}...${objectId.slice(-8)}`;
  };

  if (!currentAccount) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Inspector Gadget Trading Cards
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Your collection of Inspector Gadget gameplay items and trading cards
          </p>
        </div>
        <button
          onClick={fetchTradingCards}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading trading cards...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {!loading && !error && cards.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🕵️</div>
          <h4 className="text-lg font-medium text-white mb-2">
            No Inspector Gadget Cards Found
          </h4>
          <p className="text-gray-600 mb-4">
            You don't have any Inspector Gadget trading cards in your wallet yet.
          </p>
          <p className="text-sm text-gray-500">
            Start collecting Inspector Gadget's iconic gadgets and tools!
          </p>
        </div>
      )}

      {!loading && !error && cards.length > 0 && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-blue-600 text-2xl mr-3">📊</div>
              <div>
                <h4 className="font-semibold text-blue-800">Collection Summary</h4>
                <p className="text-white text-sm">
                  You own {cards.length} Inspector Gadget trading card{cards.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => (
              <div key={card.objectId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                {/* Card Image */}
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                  {card.mediaUrlDisplay || card.mediaUrlPrimary ? (
                    <img
                      src={card.mediaUrlDisplay || card.mediaUrlPrimary}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="text-6xl text-gray-300 hidden">🕵️</div>
                </div>

                {/* Card Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-white text-sm leading-tight">
                      {card.title}
                    </h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(card.rarity)}`}>
                      {card.rarity}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span className="font-medium">{card.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rank:</span>
                      <span className="font-medium">{card.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mint #:</span>
                      <span className="font-medium">#{card.mintNumber}</span>
                    </div>
                    {card.enhancement && card.enhancement !== 'None' && (
                      <div className="flex justify-between">
                        <span>Enhancement:</span>
                        <span className="font-medium text-purple-600">{card.enhancement}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-mono">
                      {formatObjectId(card.objectId)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

