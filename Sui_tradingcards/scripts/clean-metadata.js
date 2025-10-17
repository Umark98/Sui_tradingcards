// Script to clean up accumulated metadata and keep only current data
const fs = require('fs');
const path = require('path');

const metadataFilePath = path.join(__dirname, '..', 'public', 'Gadget-minted-metadata.json');

console.log('🧹 Cleaning up metadata to remove accumulated old data...');

try {
  // Read existing metadata
  let existingMetadata = {};
  if (fs.existsSync(metadataFilePath)) {
    const fileContent = fs.readFileSync(metadataFilePath, 'utf8');
    existingMetadata = JSON.parse(fileContent);
  }

  // Clean up each card type
  Object.keys(existingMetadata).forEach(cardType => {
    const metadata = existingMetadata[cardType];
    
    console.log(`\n📋 Cleaning ${cardType}:`);
    console.log(`  - Current levels: ${metadata.levels ? metadata.levels.length : 0}`);
    console.log(`  - Current levelImages keys: ${Object.keys(metadata.levelImages || {}).join(', ')}`);
    
    // Keep only the essential fields and current levels
    const cleanedMetadata = {
      objectId: metadata.objectId,
      objectType: metadata.objectType,
      timestamp: metadata.timestamp,
      version: metadata.version,
      game: metadata.game,
      description: metadata.description,
      episodeUtility: metadata.episodeUtility,
      transferability: metadata.transferability,
      royalty: metadata.royalty,
      unlockCurrency: metadata.unlockCurrency,
      edition: metadata.edition,
      set: metadata.set,
      upgradeable: metadata.upgradeable,
      subType: metadata.subType,
      season: metadata.season,
      // Use the first level's primary image as the main image
      imageUrl: metadata.levels && metadata.levels[0] ? 
        (metadata.levels[0].mediaUrlPrimary || metadata.levels[0].mediaUrlDisplay || '') : 
        metadata.imageUrl || '',
      // Keep only current levels
      levels: metadata.levels || [],
      // Keep only current level images
      levelImages: metadata.levelImages || {},
      lastUpdated: new Date().toISOString()
    };
    
    existingMetadata[cardType] = cleanedMetadata;
    
    console.log(`  ✅ Cleaned - Levels: ${cleanedMetadata.levels.length}, LevelImages: ${Object.keys(cleanedMetadata.levelImages).length}`);
  });

  // Write cleaned metadata back to file
  fs.writeFileSync(metadataFilePath, JSON.stringify(existingMetadata, null, 2));
  
  console.log('\n🎉 Metadata cleanup completed!');
  console.log(`📁 Updated file: ${metadataFilePath}`);
  
} catch (error) {
  console.error('❌ Error cleaning metadata:', error);
}
