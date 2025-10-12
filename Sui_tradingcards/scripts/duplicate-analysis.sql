-- Duplicate NFT Analysis Queries
-- Run these queries directly in your database to analyze duplicate NFTs

-- 1. SUMMARY STATISTICS
WITH duplicate_analysis AS (
  SELECT 
    n.nft_title,
    nt.type_name,
    nr.rarity_name,
    nml.level_value,
    c.name AS collection_name,
    COUNT(n.nft_id) AS instance_count
  FROM nfts n
  LEFT JOIN nft_types nt ON n.type_id = nt.type_id
  LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
  LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
  LEFT JOIN collections c ON n.collection_id = c.collection_id
  WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
  GROUP BY 
    n.nft_title, nt.type_name, nr.rarity_name, nml.level_value, c.name
)
SELECT 
  COUNT(*) AS total_unique_combinations,
  COUNT(CASE WHEN instance_count > 1 THEN 1 END) AS combinations_with_duplicates,
  COUNT(CASE WHEN instance_count >= 10 THEN 1 END) AS high_duplicate_combinations,
  COUNT(CASE WHEN instance_count >= 100 THEN 1 END) AS very_high_duplicate_combinations,
  SUM(instance_count) AS total_nfts,
  SUM(CASE WHEN instance_count > 1 THEN instance_count - 1 ELSE 0 END) AS total_duplicate_instances,
  ROUND(
    (SUM(CASE WHEN instance_count > 1 THEN instance_count - 1 ELSE 0 END)::DECIMAL / SUM(instance_count)) * 100, 
    2
  ) AS duplicate_percentage
FROM duplicate_analysis;

-- 2. EXACT DUPLICATES (Same title, type, rarity, level, collection)
SELECT 
  n.nft_title,
  nt.type_name,
  nr.rarity_name,
  nml.level_value,
  c.name AS collection_name,
  COUNT(n.nft_id) AS duplicate_count,
  MIN(n.nft_serial_number) AS min_serial,
  MAX(n.nft_serial_number) AS max_serial,
  COUNT(DISTINCT n.user_id) AS unique_owners
FROM nfts n
LEFT JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY 
  n.nft_title, nt.type_name, nr.rarity_name, nml.level_value, c.name
HAVING COUNT(n.nft_id) >= 2
ORDER BY duplicate_count DESC
LIMIT 50;

-- 3. TITLE DUPLICATES (Same title, different attributes)
SELECT 
  n.nft_title,
  COUNT(DISTINCT CONCAT(nt.type_name, '|', nr.rarity_name, '|', nml.level_value, '|', c.name)) AS unique_combinations,
  COUNT(n.nft_id) AS total_instances,
  COUNT(DISTINCT n.user_id) AS unique_owners,
  STRING_AGG(DISTINCT nt.type_name, ', ') AS types,
  STRING_AGG(DISTINCT nr.rarity_name, ', ') AS rarities,
  STRING_AGG(DISTINCT c.name, ', ') AS collections
FROM nfts n
LEFT JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY n.nft_title
HAVING COUNT(n.nft_id) >= 2
ORDER BY total_instances DESC
LIMIT 50;

-- 4. TYPE/COLLECTION DUPLICATES (Potential bundling candidates)
SELECT 
  nt.type_name,
  c.name AS collection_name,
  COUNT(DISTINCT n.nft_title) AS unique_titles,
  COUNT(n.nft_id) AS total_instances,
  COUNT(DISTINCT n.user_id) AS unique_owners,
  STRING_AGG(DISTINCT n.nft_title, ', ') AS sample_titles
FROM nfts n
LEFT JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY nt.type_name, c.name
HAVING COUNT(n.nft_id) >= 2
ORDER BY total_instances DESC
LIMIT 50;

-- 5. TOP DUPLICATE PATTERNS
SELECT 
  n.nft_title,
  nt.type_name,
  nr.rarity_name,
  nml.level_value,
  c.name AS collection_name,
  COUNT(n.nft_id) AS duplicate_count,
  ROUND((COUNT(n.nft_id)::DECIMAL / (SELECT COUNT(*) FROM nfts)) * 100, 2) AS percentage_of_total
FROM nfts n
LEFT JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
LEFT JOIN nft_mint_levels nml ON n.level_id = nml.level_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY 
  n.nft_title, nt.type_name, nr.rarity_name, nml.level_value, c.name
HAVING COUNT(n.nft_id) >= 2
ORDER BY duplicate_count DESC
LIMIT 20;

-- 6. RARITY DUPLICATE ANALYSIS
SELECT 
  nr.rarity_name,
  COUNT(DISTINCT n.nft_title) AS unique_titles,
  COUNT(n.nft_id) AS total_instances,
  COUNT(DISTINCT n.user_id) AS unique_owners,
  ROUND(AVG(duplicate_counts.avg_duplicates), 2) AS avg_duplicates_per_title
FROM nfts n
LEFT JOIN nft_rarities nr ON n.rarity_id = nr.rarity_id
LEFT JOIN (
  SELECT 
    n2.nft_title,
    nr2.rarity_name,
    COUNT(n2.nft_id) AS avg_duplicates
  FROM nfts n2
  LEFT JOIN nft_rarities nr2 ON n2.rarity_id = nr2.rarity_id
  WHERE n2.nft_title IS NOT NULL AND n2.nft_title != ''
  GROUP BY n2.nft_title, nr2.rarity_name
) duplicate_counts ON n.nft_title = duplicate_counts.nft_title AND nr.rarity_name = duplicate_counts.rarity_name
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY nr.rarity_name
ORDER BY total_instances DESC;

-- 7. COLLECTION DUPLICATE ANALYSIS
SELECT 
  c.name AS collection_name,
  COUNT(DISTINCT n.nft_title) AS unique_titles,
  COUNT(n.nft_id) AS total_instances,
  COUNT(DISTINCT n.user_id) AS unique_owners,
  ROUND(AVG(duplicate_counts.avg_duplicates), 2) AS avg_duplicates_per_title
FROM nfts n
LEFT JOIN collections c ON n.collection_id = c.collection_id
LEFT JOIN (
  SELECT 
    n2.nft_title,
    c2.name,
    COUNT(n2.nft_id) AS avg_duplicates
  FROM nfts n2
  LEFT JOIN collections c2 ON n2.collection_id = c2.collection_id
  WHERE n2.nft_title IS NOT NULL AND n2.nft_title != ''
  GROUP BY n2.nft_title, c2.name
) duplicate_counts ON n.nft_title = duplicate_counts.nft_title AND c.name = duplicate_counts.name
WHERE n.nft_title IS NOT NULL AND n.nft_title != ''
GROUP BY c.name
ORDER BY total_instances DESC;
