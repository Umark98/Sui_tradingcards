# Environment Variables for Blockchain Contracts Setup

## Required Environment Variables

Create a `.env` file in the `blockchain-contracts/setup/` directory with the following variables:

### Sui Network Configuration
```bash
SUI_NETWORK=https://fullnode.testnet.sui.io:443
```

### Wallet Configuration
```bash
MNEMONIC=your_mnemonic_phrase_here
SUI_MNEMONIC=your_mnemonic_phrase_here
```

### Contract Addresses (updated after publishing contracts)
```bash
PACKAGE_ID=0x...
ADMIN_CAP_ID=0x...
PUBLISHER_ID=0x...
UPGRADE_CAP_ID=0x...
```

### Genesis Card Configuration (Optional - with defaults)
```bash
GENESIS_IMAGE_URL=https://your-image-url.com/genesis-card.jpg
PROJECT_URL=https://your-project-url.com
CREATOR=Your Team Name
ROYALTY=5%
ARTIST=Your Artist Name
COPYRIGHT=© 2025 Your Company
RECIPIENT_ADDRESS=0x... # Optional: Default recipient for minting (defaults to signer's address)
```

### Trading Card Configuration (for gadget cards)
```bash
CARD_TYPE=YellowHandkerchief
METADATA_OBJECT_ID=0x...
CARD_TITLE=Example Trading Card
CARD_LEVEL=1
MINTED_NUMBER=1
RECIPIENT_ADDRESS=0x...
```

## Scripts Available

- `npm run mint-metadata` - Mint metadata for trading cards
- `npm run mint-and-transfer` - Mint and transfer trading cards
- `npm run mint-genesis` - Mint genesis commemorative cards
- `npm run display` - Create display objects for genesis cards

## Usage

1. Copy this file to `.env` in the setup directory
2. Fill in your actual values
3. Run the desired script with `npm run <script-name>`
