module tradingcard::collectable_gameplay_items {
    use std::string::{ String, utf8 };
    use sui::vec_map::{ Self, VecMap };
    use tradingcard::cap::{AdminCap, TransferCap};

    const EInvalidAmount: u64 = 1;
    const EMintSupplyEnded: u64 = 2;
    const EAssetNotTransferrable: u64 = 3;
    const EVecLengthMismatch: u64 = 5;

    public struct TradingCard<phantom T> has key {
        id: UID,
        title: String,
        level: u16,
        rank: u16,
        rarity: String,
        enhancement: String,
        media_url_primary: String,
        media_url_display: String,
        metadata: ID,
        mint_number: u64
    }

    public struct TradingCardMetadata<phantom T> has key {
        id: UID,
        version: u16,
        mint_supply: Option<u64>,
        current_supply: u64,
        game: Option<String>,
        description: String,
        rarity: VecMap<u16, String>,
        enhancements: VecMap<u16, String>,
        episode_utility: Option<u64>,
        transferability: String,
        royalty: u16,
        edition: Option<String>,
        set: Option<String>,
        upgradeable: bool,
        media_urls_primary: VecMap<u16, String>,
        media_urls_display: VecMap<u16, String>,
        ranks: VecMap<u16, u16>,
        sub_type: String,
        season: Option<u16>,
    }

    public fun mint_metadata<T>(
        _: &AdminCap,
        version: u16,
        keys: vector<u16>,
        mint_supply: Option<u64>,
        game: Option<String>,
        description: String,
        rarity_values: vector<String>,
        enhancement_values: vector<String>,
        episode_utility: Option<u64>,
        transferability: String,
        royalty: u16,
        edition: Option<String>,
        set: Option<String>,
        upgradeable: bool,
        media_urls_primary_values: vector<String>,
        media_urls_display_values: vector<String>,
        rank_values: vector<u16>,
        sub_type: String,
        season: Option<u16>,
        ctx: &mut TxContext
    ) {
        let metadata = TradingCardMetadata<T> {
            id: object::new(ctx),
            version,
            mint_supply,
            current_supply: 0,
            game,
            description,
            rarity: create_vecmap(keys, rarity_values),
            enhancements: create_vecmap(keys, enhancement_values),
            episode_utility,
            transferability,
            royalty,
            edition,
            set,
            upgradeable,
            media_urls_primary: create_vecmap(keys, media_urls_primary_values),
            media_urls_display: create_vecmap(keys, media_urls_display_values),
            ranks: create_vecmap(keys, rank_values),
            sub_type,
            season,
        };

        transfer::share_object(metadata);
    }

    public fun mint_and_transfer<T>(
        _: &AdminCap,
        item_metadata: &mut TradingCardMetadata<T>,
        title: String,
        level: u16,
        metadata: ID,
        recipient: address,
        ctx: &mut TxContext) 
    {
        let mut current_supply = item_metadata.current_supply;

        if (item_metadata.mint_supply.is_some()) {
            let mint_supply = *std::option::borrow(&item_metadata.mint_supply);

            assert!(current_supply < mint_supply, EMintSupplyEnded);
        };

        current_supply = current_supply + 1;

        let rank = *item_metadata.ranks.get(&level);
        let rarity = *item_metadata.rarity.get(&level);
        let enhancement = *item_metadata.enhancements.get(&level);
        let media_url_primary = *item_metadata.media_urls_primary.get(&level);
        let media_url_display = *item_metadata.media_urls_display.get(&level);

        
        let trading_card = TradingCard<T> {
            id: object::new(ctx),
            title,
            level,
            rank,
            rarity,
            enhancement,
            media_url_primary,
            media_url_display,
            metadata,
            mint_number: current_supply
        };

        transfer::transfer(trading_card, recipient);
    }

    public fun transfer<T>(_: &TransferCap, asset: TradingCard<T>, metadata: &TradingCardMetadata<T>, recipient: address) {
        assert!(metadata.transferability == utf8(b"Platform"), EAssetNotTransferrable);

        transfer::transfer(asset, recipient);
    }

    public fun level<T>(asset: &TradingCard<T>) : &u16 {
        &asset.level
    }

    fun create_vecmap<V: copy + drop>(keys: vector<u16>, values: vector<V>) : VecMap<u16, V> {
        let len = keys.length();
        assert!(len == values.length(), EVecLengthMismatch);

        let mut data = vec_map::empty<u16, V>();
        let mut i = 0;
        while (i < len) {
            add_internal(&mut data, keys[i], values[i]);
            i = i + 1;
        };

        data
    }

    fun add_internal<V>(vec_map: &mut VecMap<u16, V>, level: u16, value: V) {
        vec_map.insert(level, value)
    }
}