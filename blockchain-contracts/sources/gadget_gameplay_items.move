module tradingcard::gadget_gameplay_items {
    use std::string::{ String, utf8 };
    use sui::vec_map::{ Self, VecMap };
    // use sui::token::{ Self, Token, TokenPolicy };
    // use gamisodes::g_bucks::G_BUCKS;
    // use gamisodes::gadget_coin::GADGET_COIN;
    // use gamisodes::gadget_gem::GADGET_GEM;
    use tradingcard::cap::AdminCap;
    use tradingcard::cap::TransferCap;

    const EInvalidToken: u64 = 0;
    const EInvalidAmount: u64 = 1;
    const EAssetNotTransferrable: u64 = 3;
    const ENotUpgradeable: u64 = 4;
    const EVecLengthMismatch: u64 = 5;

    public struct TradingCard<phantom T> has drop {}
   
    public struct GadgetGameplayItem<phantom T> has key {
        id: UID,
        title: String,
        level: u16,
        rank: u16,
        rarity: String,
        enhancement: String,
        media_url_primary: String,
        media_url_display: String,
        metadata: ID,
        minted_number: u64,
    }

    public struct GadgetGameplayItemMetadata<phantom T> has key, store {
        id: UID,
        version: u16,
        // ig_coin_price: VecMap<u16, u64>,
        // ig_gem_price: VecMap<u16, u64>,
        // gbucks_price: VecMap<u16, u64>,
        game: Option<String>,
        description: String,
        rarity: VecMap<u16, String>,
        enhancements: VecMap<u16, String>,
        episode_utility: Option<u64>,
        transferability: String,
        royalty: u16,
        unlock_currency: Option<String>,
        unlock_threshold: VecMap<u16, u64>,
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
        // ig_coin_price_values: vector<u64>,
        // ig_gem_price_values: vector<u64>,
        // gbucks_price_values: vector<u64>,
        game: Option<String>,
        description: String,
        rarity_values: vector<String>,
        enhancement_values: vector<String>,
        episode_utility: Option<u64>,
        transferability: String,
        royalty: u16,
        unlock_currency: Option<String>,
        unlock_threshold_values: vector<u64>,
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
        let metadata = GadgetGameplayItemMetadata<T> {
            id: object::new(ctx),
            version,
            // ig_coin_price: create_vecmap(keys, ig_coin_price_values),
            // ig_gem_price: create_vecmap(keys, ig_gem_price_values),
            // gbucks_price: create_vecmap(keys, gbucks_price_values),
            game,
            description,
            rarity: create_vecmap(keys, rarity_values),
            enhancements: create_vecmap(keys, enhancement_values),
            episode_utility,
            transferability,
            royalty,
            unlock_currency,
            unlock_threshold: create_vecmap(keys, unlock_threshold_values),
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

    public fun edit_metadata<T>(
        _: &AdminCap,
        metadata: &mut GadgetGameplayItemMetadata<T>,
        version: u16,
        keys: vector<u16>,
        game: Option<String>,
        description: String,
        rarity_values: vector<String>,
        enhancement_values: vector<String>,
        episode_utility: Option<u64>,
        transferability: String,
        royalty: u16,
        unlock_currency: Option<String>,
        unlock_threshold_values: vector<u64>,
        edition: Option<String>,
        set: Option<String>,
        upgradeable: bool,
        media_urls_primary_values: vector<String>,
        media_urls_display_values: vector<String>,
        rank_values: vector<u16>,
        sub_type: String,
        season: Option<u16>
    ) {
        metadata.version = version;
        metadata.game = game;
        metadata.description = description;
        metadata.rarity = create_vecmap(keys, rarity_values);
        metadata.enhancements = create_vecmap(keys, enhancement_values);
        metadata.episode_utility = episode_utility;
        metadata.transferability = transferability;
        metadata.royalty = royalty;
        metadata.unlock_currency = unlock_currency;
        metadata.unlock_threshold = create_vecmap(keys, unlock_threshold_values);
        metadata.edition = edition;
        metadata.set = set;
        metadata.upgradeable = upgradeable;
        metadata.media_urls_primary = create_vecmap(keys, media_urls_primary_values);
        metadata.media_urls_display = create_vecmap(keys, media_urls_display_values);
        metadata.ranks = create_vecmap(keys, rank_values);
        metadata.sub_type = sub_type;
        metadata.season = season;
    }

    public fun mint_and_transfer<T>(
        _: &AdminCap,
        item_metadata: &mut GadgetGameplayItemMetadata<T>,
        title: String,
        level: u16,
        metadata: ID,
        minted_number: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let rank = *item_metadata.ranks.get(&level);
        let rarity = *item_metadata.rarity.get(&level);
        let enhancement = *item_metadata.enhancements.get(&level);
        let media_url_primary = *item_metadata.media_urls_primary.get(&level);
        let media_url_display = *item_metadata.media_urls_display.get(&level);

        let inspector_gadget = GadgetGameplayItem<T> {
            id: object::new(ctx),
            title,
            level,
            rank,
            rarity,
            enhancement,
            media_url_primary,
            media_url_display,
            metadata,
            minted_number,
        };

        transfer::transfer(inspector_gadget, recipient);
    }

    // public fun upgrade_gameplay_item<T, Y>(
    //     asset: &mut GadgetGameplayItem<T>, 
    //     metadata: &GadgetGameplayItemMetadata<T>, 
    //     token: Token<Y>, 
    //     policy: &mut TokenPolicy<Y>, 
    //     ctx: &mut TxContext
    // ){
    //     assert!(metadata.upgradeable == true, ENotUpgradeable);
    //     let level = level(asset);
    //     let token_type = type_name::get<Y>();
    //     let price: u64;
    //     if (token_type == type_name::get<G_BUCKS>()) {
    //         price = *metadata.gbucks_price.get(level);
    //     }
    //     else if (token_type == type_name::get<GADGET_COIN>()) {
    //         price = *metadata.ig_coin_price.get(level);
    //     }
    //     else if (token_type == type_name::get<GADGET_GEM>()) {
    //         price = *metadata.ig_gem_price.get(level);
    //     }
    //     else {
    //         abort EInvalidToken
    //     };
    //     assert!(token.value() == price, EInvalidAmount);
    //     let spend_request = token::spend(token, ctx);
    //     token::confirm_request_mut(policy, spend_request, ctx); 
    //     asset.level = *level + 1;
    //     asset.rank = *metadata.ranks.get(&asset.level);
    //     asset.enhancement = *metadata.enhancements.get(&asset.level);
    //     asset.media_url_primary = *metadata.media_urls_primary.get(&asset.level);
    //     asset.media_url_display = *metadata.media_urls_display.get(&asset.level);
    // }

    public fun update_price<T>(_: &AdminCap, metadata: &mut GadgetGameplayItemMetadata<T>, token: String, level: u16, new_price: u64) {
        // let price: &mut u64;
        // if (token == utf8(b"G_BUCKS")) {
        //     price = metadata.gbucks_price.get_mut(&level);
        // }
        // else if (token == utf8(b"GADGET_COIN")) {
        //     price = metadata.ig_coin_price.get_mut(&level);
        // }
        // else if (token == utf8(b"GADGET_GEM")) {
        //     price = metadata.ig_gem_price.get_mut(&level);
        // }
        // else {
        //     abort EInvalidToken
        // };
        // *price = new_price;
    }

    public fun transfer<T>(_: &TransferCap, asset: GadgetGameplayItem<T>, metadata: &GadgetGameplayItemMetadata<T>, recipient: address) {
        assert!(metadata.transferability == utf8(b"Platform"), EAssetNotTransferrable);
        transfer::transfer(asset, recipient);
    }

    public fun level<T>(asset: &GadgetGameplayItem<T>) : &u16 {
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