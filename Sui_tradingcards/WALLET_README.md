# Sui Wallet Integration

This document describes the Sui wallet integration functionality added to the Inspector Gadget application.

## Features

### Wallet Connection
- **Connect Button**: Users can connect their Sui-compatible wallets (Sui Wallet, Suiet, etc.)
- **Network Support**: Currently configured for Sui Testnet
- **Wallet Provider**: Uses `@mysten/wallet-kit` for seamless wallet integration

### Wallet Information Display
- **Address Display**: Shows the connected wallet address with copy functionality
- **Balance Display**: Real-time SUI balance fetching and display
- **Wallet Details**: Shows wallet name and network information
- **Refresh Functionality**: Manual balance refresh capability

### Inspector Gadget Trading Cards
- **Dedicated Card Display**: Specialized component for Inspector Gadget trading cards
- **Card Details**: Shows title, level, rank, rarity, enhancement, and mint number
- **Visual Cards**: Displays card images with Inspector Gadget theme
- **Collection Summary**: Shows total number of cards owned
- **Card Types**: Supports all 150+ Inspector Gadget gadget types (Brella, Mallet, Laser, etc.)

### Asset Management
- **NFT Display**: Shows other NFTs and assets owned by the connected wallet
- **Asset Grouping**: Groups assets by type for better organization
- **Image Support**: Displays NFT images when available
- **Object Details**: Shows object IDs and metadata for each asset

## Technical Implementation

### Components Created

1. **`/app/wallet/page.tsx`** - Main wallet page with connection interface
2. **`/components/WalletInfo.tsx`** - Displays wallet information and balance
3. **`/components/TradingCards.tsx`** - Specialized Inspector Gadget trading cards display
4. **`/components/WalletAssets.tsx`** - Shows other owned NFTs and assets
5. **Updated `LayoutProvider.tsx`** - Added WalletKitProvider wrapper

### Dependencies Added

- `@mysten/wallet-kit` - Wallet connection and management
- `@mysten/sui` - Sui blockchain interaction

### API Integration

The wallet components interact with the Sui Testnet RPC endpoint:
- `suix_getBalance` - Fetches SUI balance
- `suix_getOwnedObjects` - Retrieves owned NFTs and objects

## Usage

1. Navigate to `/wallet` in the application
2. Click the "Connect Wallet" button
3. Select your preferred Sui wallet from the available options
4. Approve the connection in your wallet
5. View your wallet information, balance, and assets

## Supported Wallets

The integration supports all Sui-compatible wallets including:
- Sui Wallet (browser extension)
- Suiet (mobile wallet)
- Any wallet implementing the Sui Wallet Standard

## Network Configuration

Currently configured for Sui Testnet. To change networks, modify the RPC endpoint in the component files.

## Inspector Gadget Trading Card Features

### Supported Card Types
The system supports all 150+ Inspector Gadget trading card types including:
- **Classic Gadgets**: Brella, Mallet, Laser, Copter, Skates
- **Body Parts**: Arms, Legs, Hands, Ears, Eyes
- **Tools & Accessories**: Magnifying Glass, Flashlight, Binoculars
- **Special Items**: TopSecretGadgetPhone, Emergency, WinnerFlag
- **And many more**: Each with unique rarity, levels, and enhancements

### Card Properties
- **Title**: The name of the Inspector Gadget item
- **Level**: Progression level of the card (1-5+)
- **Rank**: Ranking system for the card
- **Rarity**: Common, Uncommon, Rare, Epic, Legendary
- **Enhancement**: Special abilities or modifications
- **Mint Number**: Unique serial number for each card
- **Media URLs**: Primary and display images for the card

## Future Enhancements

- Support for multiple networks (Mainnet, Devnet)
- Transaction history display
- Asset transfer functionality
- Integration with trading card marketplace
- Real-time balance updates
- Card trading and marketplace features
- Card upgrade functionality using in-game currencies
- Collection achievements and rewards
