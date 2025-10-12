#!/bin/bash

# NFT Collection Portal - Quick Setup Script
# This script helps you set up the portal system quickly

set -e

echo "=================================="
echo "🎴 NFT Collection Portal Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL CLI not found (optional for testing)${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL CLI found${NC}"
fi

echo ""

# Step 2: Check .env file
echo -e "${BLUE}Step 2: Checking environment configuration...${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Would you like to create one from the template? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if [ -f portal.env.example ]; then
            cp portal.env.example .env
            echo -e "${GREEN}✓ Created .env from template${NC}"
            echo -e "${YELLOW}⚠️  Please edit .env and fill in your configuration${NC}"
            echo ""
            echo "Required variables:"
            echo "  - PGSQL_* (database credentials)"
            echo "  - ADMIN_SIGNER_PRIVATE_KEY (generate with: sui keytool generate ed25519)"
            echo "  - WALLET_ENCRYPTION_KEY (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
            echo ""
            exit 0
        else
            echo -e "${RED}❌ portal.env.example not found${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check if required env vars are set
if ! grep -q "ADMIN_SIGNER_PRIVATE_KEY=your_" .env && ! grep -q "WALLET_ENCRYPTION_KEY=your_" .env; then
    echo -e "${GREEN}✓ Environment variables appear to be configured${NC}"
else
    echo -e "${YELLOW}⚠️  Some environment variables need to be configured${NC}"
    echo "Please edit .env and set:"
    grep "your_" .env || true
fi

echo ""

# Step 3: Install dependencies
echo -e "${BLUE}Step 3: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Database setup
echo -e "${BLUE}Step 4: Database setup${NC}"
echo "Have you already set up the portal database tables? (y/n)"
read -r db_response

if [[ "$db_response" =~ ^[Nn]$ ]]; then
    echo ""
    echo "Please run the following command to set up the database:"
    echo -e "${YELLOW}psql -d your_database -f setup/user_portal_schema.sql${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Database already set up${NC}"
fi

echo ""

# Step 5: User registration
echo -e "${BLUE}Step 5: User registration${NC}"
echo "Do you want to bulk register users from legacy database? (y/n)"
read -r reg_response

if [[ "$reg_response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Running bulk registration (dry-run first)..."
    node scripts/bulk-register-users.js --dry-run
    echo ""
    echo "Does this look correct? Proceed with actual registration? (y/n)"
    read -r confirm_reg
    
    if [[ "$confirm_reg" =~ ^[Yy]$ ]]; then
        node scripts/bulk-register-users.js
        echo -e "${GREEN}✓ Users registered${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped bulk registration${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipped bulk registration${NC}"
fi

echo ""

# Step 6: NFT pre-assignment
echo -e "${BLUE}Step 6: NFT pre-assignment${NC}"
echo "Do you want to pre-assign NFTs to users? (y/n)"
read -r assign_response

if [[ "$assign_response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Running pre-assignment (dry-run first)..."
    node scripts/pre-assign-nfts.js --dry-run
    echo ""
    echo "Does this look correct? Proceed with actual assignment? (y/n)"
    read -r confirm_assign
    
    if [[ "$confirm_assign" =~ ^[Yy]$ ]]; then
        node scripts/pre-assign-nfts.js
        echo -e "${GREEN}✓ NFTs pre-assigned${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped NFT pre-assignment${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipped NFT pre-assignment${NC}"
fi

echo ""

# Step 7: Summary
echo "=================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Open the portal:"
echo -e "   ${YELLOW}http://localhost:3000/portal${NC}"
echo ""
echo "3. Test with a user email from your database"
echo ""
echo "Documentation:"
echo "  - Setup guide: PORTAL_SETUP_GUIDE.md"
echo "  - README: PORTAL_README.md"
echo ""
echo "Need help? Check the troubleshooting section in PORTAL_SETUP_GUIDE.md"
echo ""

