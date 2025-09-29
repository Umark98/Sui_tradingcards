
module tradingcard::package {
    const VERSION: u16 = 1;
    
    public struct PACKAGE has drop {}
    
    public fun version(): u16 { VERSION }
}