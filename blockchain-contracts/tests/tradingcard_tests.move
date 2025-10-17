/*
#[test_only]
module tradingcard::tradingcard_tests;
// uncomment this line to import the module
// use tradingcard::tradingcard;

const ENotImplemented: u64 = 0;

#[test]
fun test_tradingcard() {
    // pass
}

#[test, expected_failure(abort_code = ::tradingcard::tradingcard_tests::ENotImplemented)]
fun test_tradingcard_fail() {
    abort ENotImplemented
}
*/

#[test_only]
module tradingcard::missioncards_tests {
    use tradingcard::missioncards::{Self, MissionParisRare, Genesis};
    use tradingcard::cap::{Self, AdminCap};
    use sui::test_scenario::{Self as test, Scenario};
    use sui::tx_context;

    #[test]
    fun test_mint_mission_card() {
        let scenario_val = test::begin(@0x1);
        let scenario = &mut scenario_val;
        let ctx = test::ctx(scenario);

        // Create admin cap
        let admin_cap = cap::new(ctx);
        test::transfer(admin_cap, @0x1);

        // Mint a mission card
        missioncards::mint_and_transfer<MissionParisRare>(
            &admin_cap,
            1,
            @0x2,
            ctx
        );

        // Verify the card was minted and transferred
        test::next_tx(scenario, @0x2);
        {
            let card = test::take_from_sender<Genesis<MissionParisRare>>(scenario);
            assert!(missioncards::mint_number(&card) == 1, 0);
            test::return_to_sender(scenario, card);
        };

        test::end(scenario_val);
    }
}
