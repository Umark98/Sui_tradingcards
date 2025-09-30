-- Admin Panel Database Schema for Inspector Gadget Trading Cards

-- Card configurations table
CREATE TABLE IF NOT EXISTS card_configurations (
    id SERIAL PRIMARY KEY,
    card_type VARCHAR(100) UNIQUE NOT NULL,
    object_id VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,
    mint_supply INTEGER,
    game VARCHAR(100),
    description TEXT NOT NULL,
    transferability VARCHAR(50) DEFAULT 'Platform',
    royalty INTEGER DEFAULT 0,
    edition VARCHAR(100),
    set_name VARCHAR(100),
    upgradeable BOOLEAN DEFAULT true,
    sub_type VARCHAR(100) DEFAULT 'GameplayItem',
    season INTEGER,
    episode_utility INTEGER,
    unlock_currency VARCHAR(100),
    levels JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Minting records table
CREATE TABLE IF NOT EXISTS minting_records (
    id SERIAL PRIMARY KEY,
    mint_id VARCHAR(100) UNIQUE NOT NULL,
    card_type VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    rarity VARCHAR(50) NOT NULL,
    enhancement VARCHAR(100),
    rank INTEGER,
    transaction_bytes TEXT,
    transaction_digest VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_card_configurations_type ON card_configurations(card_type);
CREATE INDEX IF NOT EXISTS idx_minting_records_recipient ON minting_records(recipient);
CREATE INDEX IF NOT EXISTS idx_minting_records_status ON minting_records(status);
CREATE INDEX IF NOT EXISTS idx_minting_records_created_at ON minting_records(created_at);

-- Sample data for testing
INSERT INTO card_configurations (
    card_type, object_id, description, levels
) VALUES (
    'Brella',
    '[DYNAMIC_PACKAGE_ID]',
    'Inspector Gadget''s iconic umbrella gadget',
    '[
        {"level": 1, "rarity": "Common", "enhancement": "Basic", "mediaUrlPrimary": "", "mediaUrlDisplay": "", "rank": 1},
        {"level": 2, "rarity": "Uncommon", "enhancement": "Enhanced", "mediaUrlPrimary": "", "mediaUrlDisplay": "", "rank": 2},
        {"level": 3, "rarity": "Rare", "enhancement": "Advanced", "mediaUrlPrimary": "", "mediaUrlDisplay": "", "rank": 3},
        {"level": 4, "rarity": "Epic", "enhancement": "Superior", "mediaUrlPrimary": "", "mediaUrlDisplay": "", "rank": 4},
        {"level": 5, "rarity": "Legendary", "enhancement": "Legendary", "mediaUrlPrimary": "", "mediaUrlDisplay": "", "rank": 5}
    ]'::jsonb
) ON CONFLICT (card_type) DO NOTHING;

