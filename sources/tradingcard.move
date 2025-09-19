module tradingcard::tradingcard {
    use sui::package;

    use tradingcard::cap;
    use tradingcard::counter_v2;
    use tradingcard::collectable_gameplay_items_display;

    public struct TRADINGCARD has drop {}

    #[allow(lint(share_owned))]
    fun init(otw: TRADINGCARD, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        let admin_cap = cap::new(ctx);
        let counter = counter_v2::new_internal(ctx);

        collectable_gameplay_items_display::setup_inspector_gadget_display(&publisher, ctx);
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_share_object(counter);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let publisher = package::claim(TRADINGCARD {}, ctx);
        let admin_cap = cap::new(ctx);
        let counter = counter_v2::new_internal(ctx);

        collectable_gameplay_items_display::setup_inspector_gadget_display(&publisher, ctx);
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_share_object(counter);
    }
}