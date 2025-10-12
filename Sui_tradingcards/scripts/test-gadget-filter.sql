-- Test Gadget Users Filter
-- This query shows users who have NFTs matching the Inspector Gadget types from the Move contract

-- Gadget types from the Move contract (first 20 for testing)
WITH gadget_types AS (
    SELECT unnest(ARRAY[
        'TopSecretGadgetPhone', 'Brella', 'Mallet', 'Legs', 'Hand', 'Arms', 'Neck', 'RightArm', 
        'Copter', 'Skates', 'Coat', 'LeftArm', 'Binoculars', 'RedMagnifyingGlass', 'Emergency', 
        'Flashlight', 'Key', 'Laser', 'LeftCuff', 'LeftEar'
    ]) AS gadget_type
)

-- Get users with gadget NFTs
SELECT 
    u.user_id,
    u.user_email,
    n.nft_title,
    n.nft_description,
    n.nft_serial_number,
    n.rarity,
    n.m_level AS minted_level,
    c.name AS collection_name,
    COUNT(n.nft_id) OVER (PARTITION BY u.user_id) AS user_total_gadgets
FROM users u
JOIN nfts n ON u.user_id = n.user_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title IN (SELECT gadget_type FROM gadget_types)
ORDER BY 
    u.user_email ASC,
    n.nft_title ASC
LIMIT 50;

-- Summary statistics
SELECT 
    COUNT(DISTINCT u.user_id) AS total_gadget_users,
    COUNT(n.nft_id) AS total_gadget_nfts,
    COUNT(DISTINCT n.nft_title) AS unique_gadget_types
FROM users u
JOIN nfts n ON u.user_id = n.user_id
WHERE n.nft_title IN (
    'TopSecretGadgetPhone', 'Brella', 'Mallet', 'Legs', 'Hand', 'Arms', 'Neck', 'RightArm', 
    'Copter', 'Skates', 'Coat', 'LeftArm', 'Binoculars', 'RedMagnifyingGlass', 'Emergency', 
    'Flashlight', 'Key', 'Laser', 'LeftCuff', 'LeftEar'
);

-- Top gadget types by count
SELECT 
    n.nft_title,
    COUNT(n.nft_id) AS total_nfts,
    COUNT(DISTINCT u.user_id) AS unique_users
FROM users u
JOIN nfts n ON u.user_id = n.user_id
WHERE n.nft_title IN (
    'TopSecretGadgetPhone', 'Brella', 'Mallet', 'Legs', 'Hand', 'Arms', 'Neck', 'RightArm', 
    'Copter', 'Skates', 'Coat', 'LeftArm', 'Binoculars', 'RedMagnifyingGlass', 'Emergency', 
    'Flashlight', 'Key', 'Laser', 'LeftCuff', 'LeftEar'
)
GROUP BY n.nft_title
ORDER BY total_nfts DESC
LIMIT 20;

-- Top gadget collectors
SELECT 
    u.user_id,
    u.user_email,
    COUNT(n.nft_id) AS gadget_count,
    COUNT(DISTINCT n.nft_title) AS unique_gadget_types,
    STRING_AGG(DISTINCT n.nft_title, ', ') AS gadget_types
FROM users u
JOIN nfts n ON u.user_id = n.user_id
WHERE n.nft_title IN (
    'TopSecretGadgetPhone', 'Brella', 'Mallet', 'Legs', 'Hand', 'Arms', 'Neck', 'RightArm', 
    'Copter', 'Skates', 'Coat', 'LeftArm', 'Binoculars', 'RedMagnifyingGlass', 'Emergency', 
    'Flashlight', 'Key', 'Laser', 'LeftCuff', 'LeftEar'
)
GROUP BY u.user_id, u.user_email
ORDER BY gadget_count DESC
LIMIT 10;
