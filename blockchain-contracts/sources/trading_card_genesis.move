module tradingcard::trading_card_genesis {
    use tradingcard::cap::AdminCap;
    use tradingcard::package;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    const EWrongVersion: u64 = 0;

    public struct CommemorativeCard1 has drop {}
    public struct CommemorativeCard2 has drop {}
    public struct CommemorativeCard3 has drop {}
    public struct CommemorativeCard4 has drop {}

    public struct Genesis<phantom T> has key {
        id: UID,
        mint_number: u64
    }

    public fun mint_and_transfer<T>(
        _: &AdminCap, 
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(package::version() == 1, EWrongVersion);

        let nfts = Genesis<T> {
            id: object::new(ctx),
            mint_number: 0
        };
        transfer::transfer(nfts, recipient);
    }

    public fun mint_number<T>(nfts: &Genesis<T>) : u64 {
        nfts.mint_number
    }

    public fun add_field<T>(_: &AdminCap) {
        assert!(package::version() == 1, EWrongVersion);
    }
}