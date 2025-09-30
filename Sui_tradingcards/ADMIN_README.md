# Admin Panel

A comprehensive admin panel for managing Inspector Gadget trading card configurations and minting operations.

## 🎯 Features

### 1. Card Configuration Management
- **Configure Card Metadata**: Set up all trading card properties including object IDs, descriptions, and level configurations
- **Multi-Level Support**: Configure up to 5+ levels per card with different rarity, enhancements, and media URLs
- **Rich Metadata**: Support for editions, sets, seasons, episode utility, and unlock requirements
- **Visual Form**: User-friendly interface for managing complex card configurations

### 2. Minting Interface
- **Visual Card Preview**: See exactly what cards will look like before minting
- **Level Selection**: Choose specific levels to mint with their corresponding rarity and enhancements
- **Recipient Management**: Mint cards to specific wallet addresses
- **Transaction Generation**: Automatic creation of Sui blockchain transactions
- **Bulk Operations**: Support for minting multiple cards

### 3. Statistics Dashboard
- **Minting Analytics**: Track total configurations, minted cards, and activity
- **Card Type Breakdown**: See which Inspector Gadget items are most popular
- **Recent Activity**: Monitor recent minting operations
- **System Information**: Display contract addresses and network details

## 🏗️ Architecture

### Database Schema
```sql
-- Card configurations
card_configurations (
    card_type VARCHAR(100) UNIQUE,
    object_id VARCHAR(100),
    levels JSONB,
    description TEXT,
    transferability VARCHAR(50),
    royalty INTEGER,
    -- ... more fields
)

-- Minting records
minting_records (
    mint_id VARCHAR(100) UNIQUE,
    card_type VARCHAR(100),
    level INTEGER,
    recipient VARCHAR(100),
    transaction_digest VARCHAR(100),
    status VARCHAR(50)
)
```

### API Endpoints
- `POST /api/admin/card-config` - Save card configuration
- `GET /api/admin/card-configs` - Fetch all configurations
- `POST /api/admin/mint-card` - Create minting transaction
- `GET /api/admin/stats` - Get admin statistics

## 🔧 Setup Instructions

### 1. Database Setup
```bash
# Run the admin schema setup
psql -d your_database -f setup/admin_schema.sql
```

### 2. Environment Configuration
Ensure your database connection is properly configured in `service/pool.ts`.

### 3. Contract Integration
The admin panel is configured to work with your deployed Sui contracts:
- **Package ID**: `[DYNAMIC - Updated after contract publishing]`
- **Admin Cap**: `[DYNAMIC - Updated after contract publishing]`
- **Publisher ID**: `[DYNAMIC - Updated after contract publishing]`

> **Note**: Contract addresses are automatically updated when you publish contracts through the admin panel. The system uses dynamic contract address management to ensure all components use the correct addresses.

## 📋 Usage Guide

### 1. Configure a Card
1. Navigate to `/admin`
2. Go to "Card Configuration" tab
3. Select card type from Inspector Gadget items
4. Enter object ID from your deployed contracts
5. Configure description and metadata
6. Set up levels with rarity, enhancements, and media URLs
7. Save configuration

### 2. Mint Cards
1. Go to "Mint Cards" tab
2. Connect your admin wallet
3. Select card configuration
4. Choose level and recipient
5. Preview the card
6. Execute minting transaction

### 3. Monitor Activity
1. Check "Statistics" tab for overview
2. View recent mints and popular card types
3. Monitor system health and contract addresses

## 🔐 Security Considerations

### Admin Access Control
- Currently open access - implement authentication as needed
- Consider role-based access control for production
- Protect admin wallet private keys

### Transaction Security
- Admin transactions require proper wallet connection
- Consider multi-signature requirements for production
- Implement transaction approval workflows

## 🚀 Advanced Features

### Custom Card Types
The system supports all 150+ Inspector Gadget card types:
- Classic gadgets (Brella, Mallet, Laser)
- Body parts (Arms, Legs, Hands)
- Tools and accessories
- Special items and collectibles

### Level Progression
- Configure up to 5+ levels per card
- Each level has unique rarity, enhancement, and media
- Support for unlock thresholds and progression requirements

### Metadata Flexibility
- JSON-based level configuration
- Support for custom fields and properties
- Version control for configuration updates

## 🔄 Integration with Existing System

### Wallet Integration
- Admin panel works with existing wallet connection system
- Uses same Sui wallet adapter and provider
- Consistent UI/UX with main application

### Trading Card Display
- Configured cards automatically appear in user wallets
- Full integration with existing `TradingCards` component
- Real-time updates when new cards are minted

## 📊 Monitoring and Analytics

### Key Metrics
- Total configurations created
- Cards minted by type and level
- Popular card types and rarity distribution
- Transaction success rates

### System Health
- Database connection status
- Contract interaction monitoring
- Network connectivity checks

## 🛠️ Development

### Adding New Features
1. Extend database schema as needed
2. Update API endpoints
3. Modify admin components
4. Test with Sui testnet

### Customization
- Modify card types list in `CardConfigForm.tsx`
- Update contract addresses in API routes
- Customize UI themes and styling
- Add new metadata fields

This admin panel provides complete control over your Inspector Gadget trading card ecosystem, enabling you to configure, mint, and monitor all aspects of your NFT collection! 🕵️✨

