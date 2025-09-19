module tradingcard::counter_v2 {
    use sui::dynamic_field::{ Self };
    use sui::package::Publisher;
    use tradingcard::package::{Self, PACKAGE};

    const ENotUpgrade: u64 = 0;
    const ETypeNotFromPackage: u64 = 1;

    public struct AssetKey<phantom T> has copy, store, drop {}

    public struct Counter has key, store {
        id: UID,
        version: u16,
    }

    public(package) fun new_internal(ctx: &mut TxContext) : Counter {
        Counter {
            id: object::new(ctx),
            version: package::version(),
        }
    }

    public fun version(self: &Counter): u16 {
        self.version
    }

    public(package) fun add_field<T>(counter: &mut Counter) {
        dynamic_field::add<AssetKey<T>, u64>(&mut counter.id, AssetKey<T> {}, 0)
    }

    public(package) fun incr_counter<T>(counter: &mut Counter) {
        let counter = dynamic_field::borrow_mut<AssetKey<T>, u64>(&mut counter.id, AssetKey<T> {});
        *counter = *counter + 1;
    }

    public fun num_minted<T>(counter: &Counter) : u64 {
        *dynamic_field::borrow(&counter.id, AssetKey<T> {})
    }

    public(package) fun add_existing_assets<T>(counter: &mut Counter, minted: u64) {
        add_field<T>(counter);
        let counter = dynamic_field::borrow_mut<AssetKey<T>, u64>(&mut counter.id, AssetKey<T> {});
        *counter = minted
    }
    
    entry fun update_version(counter: &mut Counter, publisher: &Publisher) {
        assert!(publisher.from_package<PACKAGE>(), ETypeNotFromPackage);
        let version = package::version();
        assert!(counter.version < version, ENotUpgrade);
        counter.version = version;
    }

    #[test_only]
    public fun upgrade_version(counter: &mut Counter) {
        counter.version = counter.version + 1;
    }
}