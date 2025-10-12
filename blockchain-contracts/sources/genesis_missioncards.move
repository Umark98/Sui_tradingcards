module tradingcard::genesis_missoncards {
    use tradingcard::cap::AdminCap;
    use tradingcard::package;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    const EWrongVersion: u64 = 0;

    public struct MissionParisRare has drop {}
    public struct MissionParisEpic has drop {}
    public struct MissionParisLegendary has drop {}
    public struct MissionParisUltraCommon has drop {}
    public struct MissionParisUltraCommonSigned has drop {}
    public struct MissionDublinSuperLegendary has drop {}
    public struct MissionDublinLegendary has drop {}
    public struct MissionDublinEpic has drop {}
    public struct MissionDublinRare has drop {}
    public struct MissionDublinUltraCommonSigned has drop {}
    public struct MissionDublinUltraCommon has drop {}
    public struct MissionNewYorkCityUltraCommon has drop {}
    public struct MissionNewYorkCityLegendary has drop {}
    public struct MissionNewYorkCityEpic has drop {}
    public struct MissionNewYorkCityRare has drop {}
    public struct MissionNewYorkCityUltraCommonSigned has drop {}
    public struct MissionSydneyUltraCommon has drop {}
    public struct MissionSydneyUltraCommonSigned has drop {}
    public struct MissionSydneyRare has drop {}
    public struct MissionSydneyEpic has drop {}
    public struct MissionSydneyLegendary has drop {}
    public struct MissionSanDiegoUltraCommon has drop {}
    public struct MissionSanDiegoUltraCommonSigned has drop {}
    public struct MissionSanDiegoRare has drop {}
    public struct MissionSanDiegoEpic has drop {}
    public struct MissionSanDiegoLegendary has drop {}
    public struct MissionSingaporeUltraCommon has drop {}
    public struct MissionTransylvaniaUltraCommon has drop {}
    public struct MissionTransylvaniaUltraCommonSigned has drop {}

    public struct Genesis<phantom T> has key {
        id: UID,
        mint_number: u64
    }

    public fun mint_and_transfer<T>(
        _: &AdminCap, 
        mint_number: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(package::version() == 1, EWrongVersion);

        let nfts = Genesis<T> {
            id: object::new(ctx),
            mint_number
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