/// Module: gamisodes
module tradingcard::gamisodes {
    use sui::package;

    use tradingcard::cap;
    // use gamisodes::counter;
    use tradingcard::gadget_gameplay_items_display;

    public struct GAMISODES has drop {}

    #[allow(lint(share_owned))]
    fun init(otw: GAMISODES, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        let admin_cap = cap::new(ctx);
        // let mut counter = counter::new(ctx);

        // display::setup_display(&publisher, ctx);
        gadget_gameplay_items_display::setup_inspector_gadget_display(&publisher, ctx);
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_transfer(publisher, ctx.sender());
        // transfer::public_share_object(counter);
    }

    // Replicate the original init, but remove the initial_minting as it is deprecated.
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let publisher = package::claim(GAMISODES {}, ctx);
        let admin_cap = cap::new(ctx);
        // let counter = counter::new(ctx);

        // display::setup_display(&publisher, ctx);
        gadget_gameplay_items_display::setup_inspector_gadget_display(&publisher, ctx);
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_share_object(counter);
    }
}
