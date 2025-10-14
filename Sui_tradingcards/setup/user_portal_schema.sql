-- User Portal Database Schema for NFT Collection System
-- This schema supports the lazy minting/collect system for pre-assigned NFTs

-- Portal Users Table (with custodial wallets)
CREATE TABLE IF NOT EXISTS portal_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    custodial_wallet VARCHAR(100) UNIQUE NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT Reservations Table (Pre-assigned NFTs)
CREATE TABLE IF NOT EXISTS nft_reservations (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    nft_title VARCHAR(200) NOT NULL,
    nft_type VARCHAR(100) NOT NULL,
    rarity VARCHAR(50),
    level INTEGER NOT NULL,
    collection_name VARCHAR(100),
    description TEXT,
    metadata_uri TEXT,
    image_url TEXT,
    original_nft_id INTEGER,
    voucher_id VARCHAR(100) UNIQUE,
    voucher_signature TEXT,
    voucher_expiry BIGINT,
    status VARCHAR(50) DEFAULT 'reserved',
    object_id VARCHAR(100),
    minted_at TIMESTAMP,
    transaction_digest VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES portal_users(email) ON DELETE CASCADE
);

-- Voucher Generation Log
CREATE TABLE IF NOT EXISTS voucher_logs (
    id SERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL,
    voucher_id VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'generated',
    FOREIGN KEY (reservation_id) REFERENCES nft_reservations(id) ON DELETE CASCADE
);

-- User Activity Log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portal_users_email ON portal_users(email);
CREATE INDEX IF NOT EXISTS idx_portal_users_wallet ON portal_users(custodial_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_reservations_email ON nft_reservations(email);
CREATE INDEX IF NOT EXISTS idx_nft_reservations_status ON nft_reservations(status);
CREATE INDEX IF NOT EXISTS idx_nft_reservations_voucher_id ON nft_reservations(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_logs_reservation ON voucher_logs(reservation_id);
CREATE INDEX IF NOT EXISTS idx_voucher_logs_status ON voucher_logs(status);
CREATE INDEX IF NOT EXISTS idx_user_activity_email ON user_activity_log(email);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portal_users_updated_at
    BEFORE UPDATE ON portal_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE portal_users IS 'Stores user accounts with custodial wallets for NFT collection';
COMMENT ON TABLE nft_reservations IS 'Pre-assigned NFTs waiting to be collected by users';
COMMENT ON TABLE voucher_logs IS 'Tracks voucher generation and usage';
COMMENT ON TABLE user_activity_log IS 'Logs all user activities for audit purposes';

COMMENT ON COLUMN nft_reservations.status IS 'Status: reserved, claimed, minted, failed';
COMMENT ON COLUMN nft_reservations.voucher_id IS 'Unique identifier for the voucher';
COMMENT ON COLUMN nft_reservations.voucher_signature IS 'Cryptographic signature for verification';
COMMENT ON COLUMN nft_reservations.rarity IS 'Rarity level (nullable - not used for genesis cards)';
COMMENT ON COLUMN nft_reservations.level IS 'Level for gadget cards, or mint_number for genesis cards';

