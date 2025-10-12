-- Fix card types in the database
-- Genesis Commemorative Cards should be type "Collector's Edition"
-- Mission cards should be type "Mission"

-- First, let's check what we currently have
SELECT 
    n.nft_title,
    nt.type_name,
    c.name as collection_name,
    COUNT(*) as count
FROM nfts n
JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title LIKE '%Genesis Commemorative Card%' 
   OR n.nft_title LIKE '%Mission%'
   OR c.name IN ('Genesis', 'Missions')
GROUP BY n.nft_title, nt.type_name, c.name
ORDER BY n.nft_title;

-- Update Genesis Commemorative Cards to "Collector's Edition" type
UPDATE nfts 
SET type_id = (
    SELECT type_id 
    FROM nft_types 
    WHERE type_name = 'Collector''s Edition'
)
WHERE nft_title IN (
    'Genesis Commemorative Card #1',
    'Genesis Commemorative Card #2', 
    'Genesis Commemorative Card #3',
    'Genesis Commemorative Card #4'
);

-- Update Mission cards to "Mission" type
UPDATE nfts 
SET type_id = (
    SELECT type_id 
    FROM nft_types 
    WHERE type_name = 'Mission'
)
WHERE nft_title LIKE '%Mission%' 
   AND collection_id = (
       SELECT collection_id 
       FROM collections 
       WHERE name = 'Missions'
   )
   AND (type_id IS NULL OR type_id != (
       SELECT type_id 
       FROM nft_types 
       WHERE type_name = 'Mission'
   ));

-- If "Mission" type doesn't exist, create it
INSERT INTO nft_types (type_name) 
SELECT 'Mission' 
WHERE NOT EXISTS (
    SELECT 1 FROM nft_types WHERE type_name = 'Mission'
);

-- If "Collector's Edition" type doesn't exist, create it
INSERT INTO nft_types (type_name) 
SELECT 'Collector''s Edition' 
WHERE NOT EXISTS (
    SELECT 1 FROM nft_types WHERE type_name = 'Collector''s Edition'
);

-- Verify the changes
SELECT 
    n.nft_title,
    nt.type_name,
    c.name as collection_name,
    COUNT(*) as count
FROM nfts n
JOIN nft_types nt ON n.type_id = nt.type_id
LEFT JOIN collections c ON n.collection_id = c.collection_id
WHERE n.nft_title LIKE '%Genesis Commemorative Card%' 
   OR n.nft_title LIKE '%Mission%'
   OR c.name IN ('Genesis', 'Missions')
GROUP BY n.nft_title, nt.type_name, c.name
ORDER BY n.nft_title;
