-- Unique NFT Analysis Query
-- This query shows all unique NFT combinations without user/wallet information
-- Run this in your database to see the unique NFT data

SELECT 
  n.nft_title,
  n.nft_description,
  n.numentities,
  n.type,
  n.rarity,
  n.m_level AS minted_level,
  n.edition_size,
  nt.type_id,
  nt.type_name,
  nr.rarity_id,
  nr.rarity_name,
  nml.level_id,
  nml.level_value,
  c.collection_id,
  c.name AS collection_name,
  c.series AS collection_series,
  a.artist_id,
  a.name AS artist_name,
  a.copyright AS artist_copyright,
  p.platform_id,
  p.name AS platform_name,
  COUNT(n.nft_id) AS total_instances,
  MIN(n.nft_serial_number) AS min_serial_number,
  MAX(n.nft_serial_number) AS max_serial_number,
  COUNT(DISTINCT n.user_id) AS unique_owners
FROM nfts n
LEFT JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
LEFT JOIN artists a ON n.artist_id = a.artist_id
LEFT JOIN platforms p ON c.platform_id = p.platform_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY 
  n.nft_title, n.nft_description, n.numentities, n.type, n.rarity, n.m_level, n.edition_size,
  nt.type_id, nt.type_name, nr.rarity_id, nr.rarity_name, nml.level_id, nml.level_value,
  c.collection_id, c.name, c.series, a.artist_id, a.name, a.copyright, p.platform_id, p.name
ORDER BY 
  c.name ASC, 
  nt.type_name ASC, 
  n.nft_title ASC, 
  nr.rarity_id ASC, 
  nml.level_value ASC
LIMIT 1000;

-- Summary Statistics Query
SELECT 
  COUNT(DISTINCT n.nft_title) AS unique_titles,
  COUNT(DISTINCT nt.type_name) AS unique_types,
  COUNT(DISTINCT c.name) AS unique_collections,
  COUNT(DISTINCT nr.rarity_name) AS unique_rarities,
  COUNT(DISTINCT nml.level_value) AS unique_levels,
  COUNT(n.nft_id) AS total_nfts,
  COUNT(DISTINCT n.user_id) AS total_owners
FROM nfts n
LEFT JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != '';

-- Top Collections by NFT Count
SELECT 
  c.name AS collection_name,
  COUNT(DISTINCT n.nft_title) AS unique_titles,
  COUNT(n.nft_id) AS total_nfts,
  COUNT(DISTINCT n.user_id) AS unique_owners
FROM nfts n
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY c.name
ORDER BY total_nfts DESC
LIMIT 20;

-- Top NFT Types by Count
SELECT 
  nt.type_name,
  COUNT(DISTINCT n.nft_title) AS unique_titles,
  COUNT(n.nft_id) AS total_nfts,
  COUNT(DISTINCT n.user_id) AS unique_owners
FROM nfts n
LEFT JOIN nft_types nt ON n.type_id = nt.type_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY nt.type_name
ORDER BY total_nfts DESC
LIMIT 20;

-- Rarity Distribution
SELECT 
  nr.rarity_name,
  COUNT(DISTINCT n.nft_title) AS unique_titles,
  COUNT(n.nft_id) AS total_nfts,
  COUNT(DISTINCT n.user_id) AS unique_owners
FROM nfts n
LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY nr.rarity_name
ORDER BY total_nfts DESC;
