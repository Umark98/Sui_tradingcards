// Metadata cache utility for production performance
import * as fs from 'fs';
import * as path from 'path';

interface CacheEntry<T> {
  data: T;
  lastUpdated: number;
}

class MetadataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get metadata from cache or load from file
   */
  private getCachedOrLoad<T>(
    key: string,
    filePath: string,
    defaultValue: T
  ): T {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached data if still valid
    if (cached && now - cached.lastUpdated < this.CACHE_TTL) {
      return cached.data;
    }

    // Load from file
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.cache.set(key, { data, lastUpdated: now });
        return data;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error loading ${key}:`, error);
      }
    }

    return defaultValue;
  }

  /**
   * Load all display images (Mission + Genesis + Gadget)
   */
  loadDisplayImages(): Record<string, string> {
    const missionPath = path.join(process.cwd(), 'public', 'mission-displays.json');
    const genesisPath = path.join(process.cwd(), 'public', 'genesis-displays.json');

    const displayImages: Record<string, string> = {};

    // Load mission displays
    const missionDisplays = this.getCachedOrLoad('mission-displays', missionPath, {});
    Object.entries(missionDisplays).forEach(([cardType, data]: [string, any]) => {
      if (data.imageUrl) {
        displayImages[cardType] = data.imageUrl;
      }
    });

    // Load genesis displays
    const genesisDisplays = this.getCachedOrLoad('genesis-displays', genesisPath, {});
    Object.entries(genesisDisplays).forEach(([cardType, data]: [string, any]) => {
      if (data.imageUrl) {
        displayImages[cardType] = data.imageUrl;
      }
    });

    return displayImages;
  }

  /**
   * Load gadget metadata (for level-specific images)
   */
  loadGadgetMetadata(): Record<string, any> {
    const metadataPath = path.join(process.cwd(), 'public', 'Gadget-minted-metadata.json');
    return this.getCachedOrLoad('gadget-metadata', metadataPath, {});
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const metadataCache = new MetadataCache();

