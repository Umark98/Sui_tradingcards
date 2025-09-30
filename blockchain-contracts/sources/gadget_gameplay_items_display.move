module tradingcard::gadget_gameplay_items_display {
    use std::string::utf8;

    use sui::display::{Self, Display};
    use sui::package::Publisher;

    use tradingcard::gadget_gameplay_items::{ GadgetGameplayItem, TradingCard };
   use tradingcard::gadget_gameplay_items_titles::{
    // AlarmClock, AmazonFan, Arms, Badge, BallpointPen, BeachShovel, Binoculars, BlackDuster,
    // BlackMagnifyingGlass, BlueBlowDryer, BlueStripedHandkerchief, BoatPropellerFan, BolloBalls,
    // Bone,  BucketOfWater, CanOpener, Candy, Card, CarMechanicFan, ChopSticks, Clippers,
    // Coat, Coin, Copter, CopterSpare, CountDraculasHauntedCastleTouristBrochure, Daffodils,
    // Daisies, DemagnetizedCompass, DeskLamp, DistressSignalFlag, Doll, DuckCall, Ears, EgyptFan,
    // Emergency, EverestIslandFan, FeatherDuster, FingerprintDustingKit, FirecrackerSkates,
    // FishNet, FiveHands, FlashbulbCamera, FlashcubeCamera, Flashlight, FlightSafetyLiterature,
    // Flippers, Fork, FountainPen, GadgetMobileKeys, GardeningShovel, Geraniums, Hand, HandOfCards,
    // HandheldFlashlight, HatTip, HeadWheel, IceSkates, IdentificationPaper, Key, Keyboard,
    // KitchenKnife, Laser, LeftArm, LeftArmRetractor, LeftBinocular, LeftCuff, LeftEar, LeftLeg,
    // LeftSkate, LightBulb, Lighter, LongShovel, Magnet, MagnetShoes,  MapOfSouthAfrica,
    // MapOfTibet, Match, Megaphone, MetalFlySwatter, Neck, Net, NorthPoleCompass, Note, Notepad,
    // OilCan, PaperFan, Parachute, Pencil, Peonies, PinkEnvelope, PinkHandkerchief, PizzaChefHat,
    // PlasticFan, PlasticFlySwatter, PocketWatch, PocketWatchOnChain, PoliceId, PoolTube, Pot,
    // Primroses, PrototypeRadar, Pulley, Radar, RedBlowDryer, RedCup, RedDottedHandkerchief,
    // RedDuster, RedHandleScissors, RedMagnifyingGlass, Respirator, RightArm, RightArmRetractor,
    // RightCuff, RightEar, RightLeg, RocketSkates, Roses, SafetyScissors, Sail, Saw, Scissors,
    // Screwdriver, Shears, Shoehorn, Skates, Skis, SmallCamera, SmallMallet, Sponge, Spoon,
    // Spring, Squeegee, SteelMagnifyingGlass, StrawHat, SurrenderFlag, Superbells, Telescope,
    // TelescopingLegs, Teeth, Tie, Toothbrush, Toothpaste, TrickFlower,
    // TwoHands, TwoLeftCuffs, WaterCannon, WaterGun, WaterSkiPropeller, WeldingMask,
    // WhiteHandkerchief, WinnerFlag, WorkLight,
    // Wrench, YellowHandkerchief, Yoyo,
    Brella, TopSecretGadgetPhone,Mallet,Legs
}; 

    #[allow(lint(self_transfer))]
    public(package) fun setup_inspector_gadget_display(publisher: &Publisher, ctx: &mut TxContext) {
    let legs_display = gadget_gameplay_items_display<TradingCard<Legs>>(publisher, ctx);
    let brella_display = gadget_gameplay_items_display<TradingCard<Brella>>(publisher, ctx);
    let mallet_display = gadget_gameplay_items_display<TradingCard<Mallet>>(publisher, ctx);
    // let alarm_clock_display = gadget_gameplay_items_display<TradingCard<AlarmClock>>(publisher, ctx);
    // let amazon_fan_display = gadget_gameplay_items_display<TradingCard<AmazonFan>>(publisher, ctx);
    // let arms_display = gadget_gameplay_items_display<TradingCard<Arms>>(publisher, ctx);
    // let badge_display = gadget_gameplay_items_display<TradingCard<Badge>>(publisher, ctx);
    // let ballpoint_pen_display = gadget_gameplay_items_display<TradingCard<BallpointPen>>(publisher, ctx);
    // let beach_shovel_display = gadget_gameplay_items_display<TradingCard<BeachShovel>>(publisher, ctx);
    // let binoculars_display = gadget_gameplay_items_display<TradingCard<Binoculars>>(publisher, ctx);
    // let black_duster_display = gadget_gameplay_items_display<TradingCard<BlackDuster>>(publisher, ctx);
    // let black_magnifying_glass_display = gadget_gameplay_items_display<TradingCard<BlackMagnifyingGlass>>(publisher, ctx);
    // let blue_blow_dryer_display = gadget_gameplay_items_display<TradingCard<BlueBlowDryer>>(publisher, ctx);
    // let blue_striped_handkerchief_display = gadget_gameplay_items_display<TradingCard<BlueStripedHandkerchief>>(publisher, ctx);
    // let boat_propeller_fan_display = gadget_gameplay_items_display<TradingCard<BoatPropellerFan>>(publisher, ctx);
    // let bollo_balls_display = gadget_gameplay_items_display<TradingCard<BolloBalls>>(publisher, ctx);
    // let bone_display = gadget_gameplay_items_display<TradingCard<Bone>>(publisher, ctx);
    // let bucket_of_water_display = gadget_gameplay_items_display<TradingCard<BucketOfWater>>(publisher, ctx);
    // let can_opener_display = gadget_gameplay_items_display<TradingCard<CanOpener>>(publisher, ctx);
    // let candy_display = gadget_gameplay_items_display<TradingCard<Candy>>(publisher, ctx);
    // let card_display = gadget_gameplay_items_display<TradingCard<Card>>(publisher, ctx);
    // let car_mechanic_fan_display = gadget_gameplay_items_display<TradingCard<CarMechanicFan>>(publisher, ctx);
    // let chop_sticks_display = gadget_gameplay_items_display<TradingCard<ChopSticks>>(publisher, ctx);
    // let clippers_display = gadget_gameplay_items_display<TradingCard<Clippers>>(publisher, ctx);
    // let coat_display = gadget_gameplay_items_display<TradingCard<Coat>>(publisher, ctx);
    // let coin_display = gadget_gameplay_items_display<TradingCard<Coin>>(publisher, ctx);
    // let copter_display = gadget_gameplay_items_display<TradingCard<Copter>>(publisher, ctx);
    // let copter_spare_display = gadget_gameplay_items_display<TradingCard<CopterSpare>>(publisher, ctx);
    // let count_draculas_haunted_castle_tourist_brochure_display = gadget_gameplay_items_display<TradingCard<CountDraculasHauntedCastleTouristBrochure>>(publisher, ctx);
    // let daffodils_display = gadget_gameplay_items_display<TradingCard<Daffodils>>(publisher, ctx);
    // let daisies_display = gadget_gameplay_items_display<TradingCard<Daisies>>(publisher, ctx);
    // let demagnetized_compass_display = gadget_gameplay_items_display<TradingCard<DemagnetizedCompass>>(publisher, ctx);
    // let desk_lamp_display = gadget_gameplay_items_display<TradingCard<DeskLamp>>(publisher, ctx);
    // let distress_signal_flag_display = gadget_gameplay_items_display<TradingCard<DistressSignalFlag>>(publisher, ctx);
    // let doll_display = gadget_gameplay_items_display<TradingCard<Doll>>(publisher, ctx);
    // let duck_call_display = gadget_gameplay_items_display<TradingCard<DuckCall>>(publisher, ctx);
    // let ears_display = gadget_gameplay_items_display<TradingCard<Ears>>(publisher, ctx);
    // let egypt_fan_display = gadget_gameplay_items_display<TradingCard<EgyptFan>>(publisher, ctx);
    // let emergency_display = gadget_gameplay_items_display<TradingCard<Emergency>>(publisher, ctx);
    // let everest_island_fan_display = gadget_gameplay_items_display<TradingCard<EverestIslandFan>>(publisher, ctx);
    // let feather_duster_display = gadget_gameplay_items_display<TradingCard<FeatherDuster>>(publisher, ctx);
    // let fingerprint_dusting_kit_display = gadget_gameplay_items_display<TradingCard<FingerprintDustingKit>>(publisher, ctx);
    // let firecracker_skates_display = gadget_gameplay_items_display<TradingCard<FirecrackerSkates>>(publisher, ctx);
    // let fish_net_display = gadget_gameplay_items_display<TradingCard<FishNet>>(publisher, ctx);
    // let five_hands_display = gadget_gameplay_items_display<TradingCard<FiveHands>>(publisher, ctx);
    // let flashbulb_camera_display = gadget_gameplay_items_display<TradingCard<FlashbulbCamera>>(publisher, ctx);
    // let flashcube_camera_display = gadget_gameplay_items_display<TradingCard<FlashcubeCamera>>(publisher, ctx);
    // let flashlight_display = gadget_gameplay_items_display<TradingCard<Flashlight>>(publisher, ctx);
    // let flight_safety_literature_display = gadget_gameplay_items_display<TradingCard<FlightSafetyLiterature>>(publisher, ctx);
    // let flippers_display = gadget_gameplay_items_display<TradingCard<Flippers>>(publisher, ctx);
    // let fork_display = gadget_gameplay_items_display<TradingCard<Fork>>(publisher, ctx);
    // let fountain_pen_display = gadget_gameplay_items_display<TradingCard<FountainPen>>(publisher, ctx);
    // let gadget_mobile_keys_display = gadget_gameplay_items_display<TradingCard<GadgetMobileKeys>>(publisher, ctx);
    // let gardening_shovel_display = gadget_gameplay_items_display<TradingCard<GardeningShovel>>(publisher, ctx);
    // let geraniums_display = gadget_gameplay_items_display<TradingCard<Geraniums>>(publisher, ctx);
    // let hand_display = gadget_gameplay_items_display<TradingCard<Hand>>(publisher, ctx);
    // let hand_of_cards_display = gadget_gameplay_items_display<TradingCard<HandOfCards>>(publisher, ctx);
    // let handheld_flashlight_display = gadget_gameplay_items_display<TradingCard<HandheldFlashlight>>(publisher, ctx);
    // let hat_tip_display = gadget_gameplay_items_display<TradingCard<HatTip>>(publisher, ctx);
    // let head_wheel_display = gadget_gameplay_items_display<TradingCard<HeadWheel>>(publisher, ctx);
    // let ice_skates_display = gadget_gameplay_items_display<TradingCard<IceSkates>>(publisher, ctx);
    // let identification_paper_display = gadget_gameplay_items_display<TradingCard<IdentificationPaper>>(publisher, ctx);
    // let key_display = gadget_gameplay_items_display<TradingCard<Key>>(publisher, ctx);
    // let keyboard_display = gadget_gameplay_items_display<TradingCard<Keyboard>>(publisher, ctx);
    // let kitchen_knife_display = gadget_gameplay_items_display<TradingCard<KitchenKnife>>(publisher, ctx);
    // let laser_display = gadget_gameplay_items_display<TradingCard<Laser>>(publisher, ctx);
    // let left_arm_display = gadget_gameplay_items_display<TradingCard<LeftArm>>(publisher, ctx);
    // let left_arm_retractor_display = gadget_gameplay_items_display<TradingCard<LeftArmRetractor>>(publisher, ctx);
    // let left_binocular_display = gadget_gameplay_items_display<TradingCard<LeftBinocular>>(publisher, ctx);
    // let left_cuff_display = gadget_gameplay_items_display<TradingCard<LeftCuff>>(publisher, ctx);
    // let left_ear_display = gadget_gameplay_items_display<TradingCard<LeftEar>>(publisher, ctx);
    // let left_leg_display = gadget_gameplay_items_display<TradingCard<LeftLeg>>(publisher, ctx);
    // let left_skate_display = gadget_gameplay_items_display<TradingCard<LeftSkate>>(publisher, ctx);
    // let light_bulb_display = gadget_gameplay_items_display<TradingCard<LightBulb>>(publisher, ctx);
    // let lighter_display = gadget_gameplay_items_display<TradingCard<Lighter>>(publisher, ctx);
    // let long_shovel_display = gadget_gameplay_items_display<TradingCard<LongShovel>>(publisher, ctx);
    // let magnet_display = gadget_gameplay_items_display<TradingCard<Magnet>>(publisher, ctx);
    // let magnet_shoes_display = gadget_gameplay_items_display<TradingCard<MagnetShoes>>(publisher, ctx);
    // let map_of_south_africa_display = gadget_gameplay_items_display<TradingCard<MapOfSouthAfrica>>(publisher, ctx);
    // let map_of_tibet_display = gadget_gameplay_items_display<TradingCard<MapOfTibet>>(publisher, ctx);
    // let match_display = gadget_gameplay_items_display<TradingCard<Match>>(publisher, ctx);
    // let megaphone_display = gadget_gameplay_items_display<TradingCard<Megaphone>>(publisher, ctx);
    // let metal_fly_swatter_display = gadget_gameplay_items_display<TradingCard<MetalFlySwatter>>(publisher, ctx);
    // let neck_display = gadget_gameplay_items_display<TradingCard<Neck>>(publisher, ctx);
    // let net_display = gadget_gameplay_items_display<TradingCard<Net>>(publisher, ctx);
    // let north_pole_compass_display = gadget_gameplay_items_display<TradingCard<NorthPoleCompass>>(publisher, ctx);
    // let note_display = gadget_gameplay_items_display<TradingCard<Note>>(publisher, ctx);
    // let notepad_display = gadget_gameplay_items_display<TradingCard<Notepad>>(publisher, ctx);
    // let oil_can_display = gadget_gameplay_items_display<TradingCard<OilCan>>(publisher, ctx);
    // let paper_fan_display = gadget_gameplay_items_display<TradingCard<PaperFan>>(publisher, ctx);
    // let parachute_display = gadget_gameplay_items_display<TradingCard<Parachute>>(publisher, ctx);
    // let pencil_display = gadget_gameplay_items_display<TradingCard<Pencil>>(publisher, ctx);
    // let peonies_display = gadget_gameplay_items_display<TradingCard<Peonies>>(publisher, ctx);
    // let pink_envelope_display = gadget_gameplay_items_display<TradingCard<PinkEnvelope>>(publisher, ctx);
    // let pink_handkerchief_display = gadget_gameplay_items_display<TradingCard<PinkHandkerchief>>(publisher, ctx);
    // let pizza_chef_hat_display = gadget_gameplay_items_display<TradingCard<PizzaChefHat>>(publisher, ctx);
    // let plastic_fan_display = gadget_gameplay_items_display<TradingCard<PlasticFan>>(publisher, ctx);
    // let plastic_fly_swatter_display = gadget_gameplay_items_display<TradingCard<PlasticFlySwatter>>(publisher, ctx);
    // let pocket_watch_display = gadget_gameplay_items_display<TradingCard<PocketWatch>>(publisher, ctx);
    // let pocket_watch_on_chain_display = gadget_gameplay_items_display<TradingCard<PocketWatchOnChain>>(publisher, ctx);
    // let police_id_display = gadget_gameplay_items_display<TradingCard<PoliceId>>(publisher, ctx);
    // let pool_tube_display = gadget_gameplay_items_display<TradingCard<PoolTube>>(publisher, ctx);
    // let pot_display = gadget_gameplay_items_display<TradingCard<Pot>>(publisher, ctx);
    // let primroses_display = gadget_gameplay_items_display<TradingCard<Primroses>>(publisher, ctx);
    // let prototype_radar_display = gadget_gameplay_items_display<TradingCard<PrototypeRadar>>(publisher, ctx);
    // let pulley_display = gadget_gameplay_items_display<TradingCard<Pulley>>(publisher, ctx);
    // let radar_display = gadget_gameplay_items_display<TradingCard<Radar>>(publisher, ctx);
    // let red_blow_dryer_display = gadget_gameplay_items_display<TradingCard<RedBlowDryer>>(publisher, ctx);
    // let red_cup_display = gadget_gameplay_items_display<TradingCard<RedCup>>(publisher, ctx);
    // let red_dotted_handkerchief_display = gadget_gameplay_items_display<TradingCard<RedDottedHandkerchief>>(publisher, ctx);
    // let red_duster_display = gadget_gameplay_items_display<TradingCard<RedDuster>>(publisher, ctx);
    // let red_handle_scissors_display = gadget_gameplay_items_display<TradingCard<RedHandleScissors>>(publisher, ctx);
    // let red_magnifying_glass_display = gadget_gameplay_items_display<TradingCard<RedMagnifyingGlass>>(publisher, ctx);
    // let respirator_display = gadget_gameplay_items_display<TradingCard<Respirator>>(publisher, ctx);
    // let right_arm_display = gadget_gameplay_items_display<TradingCard<RightArm>>(publisher, ctx);
    // let right_arm_retractor_display = gadget_gameplay_items_display<TradingCard<RightArmRetractor>>(publisher, ctx);
    // let right_cuff_display = gadget_gameplay_items_display<TradingCard<RightCuff>>(publisher, ctx);
    // let right_ear_display = gadget_gameplay_items_display<TradingCard<RightEar>>(publisher, ctx);
    // let right_leg_display = gadget_gameplay_items_display<TradingCard<RightLeg>>(publisher, ctx);
    // let rocket_skates_display = gadget_gameplay_items_display<TradingCard<RocketSkates>>(publisher, ctx);
    // let roses_display = gadget_gameplay_items_display<TradingCard<Roses>>(publisher, ctx);
    // let safety_scissors_display = gadget_gameplay_items_display<TradingCard<SafetyScissors>>(publisher, ctx);
    // let sail_display = gadget_gameplay_items_display<TradingCard<Sail>>(publisher, ctx);
    // let saw_display = gadget_gameplay_items_display<TradingCard<Saw>>(publisher, ctx);
    // let scissors_display = gadget_gameplay_items_display<TradingCard<Scissors>>(publisher, ctx);
    // let screwdriver_display = gadget_gameplay_items_display<TradingCard<Screwdriver>>(publisher, ctx);
    // let shears_display = gadget_gameplay_items_display<TradingCard<Shears>>(publisher, ctx);
    // let shoehorn_display = gadget_gameplay_items_display<TradingCard<Shoehorn>>(publisher, ctx);
    // let skates_display = gadget_gameplay_items_display<TradingCard<Skates>>(publisher, ctx);
    // let skis_display = gadget_gameplay_items_display<TradingCard<Skis>>(publisher, ctx);
    // let small_camera_display = gadget_gameplay_items_display<TradingCard<SmallCamera>>(publisher, ctx);
    // let small_mallet_display = gadget_gameplay_items_display<TradingCard<SmallMallet>>(publisher, ctx);
    // let sponge_display = gadget_gameplay_items_display<TradingCard<Sponge>>(publisher, ctx);
    // let spoon_display = gadget_gameplay_items_display<TradingCard<Spoon>>(publisher, ctx);
    // let spring_display = gadget_gameplay_items_display<TradingCard<Spring>>(publisher, ctx);
    // let squeegee_display = gadget_gameplay_items_display<TradingCard<Squeegee>>(publisher, ctx);
    // let steel_magnifying_glass_display = gadget_gameplay_items_display<TradingCard<SteelMagnifyingGlass>>(publisher, ctx);
    // let straw_hat_display = gadget_gameplay_items_display<TradingCard<StrawHat>>(publisher, ctx);
    // let surrender_flag_display = gadget_gameplay_items_display<TradingCard<SurrenderFlag>>(publisher, ctx);
    // let superbells_display = gadget_gameplay_items_display<TradingCard<Superbells>>(publisher, ctx);
    // let telescope_display = gadget_gameplay_items_display<TradingCard<Telescope>>(publisher, ctx);
    // let telescoping_legs_display = gadget_gameplay_items_display<TradingCard<TelescopingLegs>>(publisher, ctx);
    // let teeth_display = gadget_gameplay_items_display<TradingCard<Teeth>>(publisher, ctx);
    // let tie_display = gadget_gameplay_items_display<TradingCard<Tie>>(publisher, ctx);
    // let toothbrush_display = gadget_gameplay_items_display<TradingCard<Toothbrush>>(publisher, ctx);
    // let toothpaste_display = gadget_gameplay_items_display<TradingCard<Toothpaste>>(publisher, ctx);
    let top_secret_gadget_phone_display = gadget_gameplay_items_display<TradingCard<TopSecretGadgetPhone>>(publisher, ctx);
    // let trick_flower_display = gadget_gameplay_items_display<TradingCard<TrickFlower>>(publisher, ctx);
    // let two_hands_display = gadget_gameplay_items_display<TradingCard<TwoHands>>(publisher, ctx);
    // let two_left_cuffs_display = gadget_gameplay_items_display<TradingCard<TwoLeftCuffs>>(publisher, ctx);
    // let water_cannon_display = gadget_gameplay_items_display<TradingCard<WaterCannon>>(publisher, ctx);
    // let water_gun_display = gadget_gameplay_items_display<TradingCard<WaterGun>>(publisher, ctx);
    // let water_ski_propeller_display = gadget_gameplay_items_display<TradingCard<WaterSkiPropeller>>(publisher, ctx);
    // let welding_mask_display = gadget_gameplay_items_display<TradingCard<WeldingMask>>(publisher, ctx);
    // let white_handkerchief_display = gadget_gameplay_items_display<TradingCard<WhiteHandkerchief>>(publisher, ctx);
    // let winner_flag_display = gadget_gameplay_items_display<TradingCard<WinnerFlag>>(publisher, ctx);
    // let work_light_display = gadget_gameplay_items_display<TradingCard<WorkLight>>(publisher, ctx);
    // let wrench_display = gadget_gameplay_items_display<TradingCard<Wrench>>(publisher, ctx);
    // let yellow_handkerchief_display = gadget_gameplay_items_display<TradingCard<YellowHandkerchief>>(publisher, ctx);
    // let yoyo_display = gadget_gameplay_items_display<TradingCard<Yoyo>>(publisher, ctx);

     transfer::public_transfer(legs_display,ctx.sender());
    // transfer::public_transfer(alarm_clock_display, ctx.sender());
    // transfer::public_transfer(amazon_fan_display, ctx.sender());
    // transfer::public_transfer(arms_display, ctx.sender());
    // transfer::public_transfer(badge_display, ctx.sender());
    // transfer::public_transfer(ballpoint_pen_display, ctx.sender());
    // transfer::public_transfer(beach_shovel_display, ctx.sender());
    // transfer::public_transfer(binoculars_display, ctx.sender());
    // transfer::public_transfer(black_duster_display, ctx.sender());
    // transfer::public_transfer(black_magnifying_glass_display, ctx.sender());
    // transfer::public_transfer(blue_blow_dryer_display, ctx.sender());
    // transfer::public_transfer(blue_striped_handkerchief_display, ctx.sender());
    // transfer::public_transfer(boat_propeller_fan_display, ctx.sender());
    // transfer::public_transfer(bollo_balls_display, ctx.sender());
    // transfer::public_transfer(bone_display, ctx.sender());
     transfer::public_transfer(brella_display, ctx.sender());
    // transfer::public_transfer(bucket_of_water_display, ctx.sender());
    // transfer::public_transfer(can_opener_display, ctx.sender());
    // transfer::public_transfer(candy_display, ctx.sender());
    // transfer::public_transfer(card_display, ctx.sender());
    // transfer::public_transfer(car_mechanic_fan_display, ctx.sender());
    // transfer::public_transfer(chop_sticks_display, ctx.sender());
    // transfer::public_transfer(clippers_display, ctx.sender());
    // transfer::public_transfer(coat_display, ctx.sender());
    // transfer::public_transfer(coin_display, ctx.sender());
    // transfer::public_transfer(copter_display, ctx.sender());
    // transfer::public_transfer(copter_spare_display, ctx.sender());
    // transfer::public_transfer(count_draculas_haunted_castle_tourist_brochure_display, ctx.sender());
    // transfer::public_transfer(daffodils_display, ctx.sender());
    // transfer::public_transfer(daisies_display, ctx.sender());
    // transfer::public_transfer(demagnetized_compass_display, ctx.sender());
    // transfer::public_transfer(desk_lamp_display, ctx.sender());
    // transfer::public_transfer(distress_signal_flag_display, ctx.sender());
    // transfer::public_transfer(doll_display, ctx.sender());
    // transfer::public_transfer(duck_call_display, ctx.sender());
    // transfer::public_transfer(ears_display, ctx.sender());
    // transfer::public_transfer(egypt_fan_display, ctx.sender());
    // transfer::public_transfer(emergency_display, ctx.sender());
    // transfer::public_transfer(everest_island_fan_display, ctx.sender());
    // transfer::public_transfer(feather_duster_display, ctx.sender());
    // transfer::public_transfer(fingerprint_dusting_kit_display, ctx.sender());
    // transfer::public_transfer(firecracker_skates_display, ctx.sender());
    // transfer::public_transfer(fish_net_display, ctx.sender());
    // transfer::public_transfer(five_hands_display, ctx.sender());
    // transfer::public_transfer(flashbulb_camera_display, ctx.sender());
    // transfer::public_transfer(flashcube_camera_display, ctx.sender());
    // transfer::public_transfer(flashlight_display, ctx.sender());
    // transfer::public_transfer(flight_safety_literature_display, ctx.sender());
    // transfer::public_transfer(flippers_display, ctx.sender());
    // transfer::public_transfer(fork_display, ctx.sender());
    // transfer::public_transfer(fountain_pen_display, ctx.sender());
    // transfer::public_transfer(gadget_mobile_keys_display, ctx.sender());
    // transfer::public_transfer(gardening_shovel_display, ctx.sender());
    // transfer::public_transfer(geraniums_display, ctx.sender());
    // transfer::public_transfer(hand_display, ctx.sender());
    // transfer::public_transfer(hand_of_cards_display, ctx.sender());
    // transfer::public_transfer(handheld_flashlight_display, ctx.sender());
    // transfer::public_transfer(hat_tip_display, ctx.sender());
    // transfer::public_transfer(head_wheel_display, ctx.sender());
    // transfer::public_transfer(ice_skates_display, ctx.sender());
    // transfer::public_transfer(identification_paper_display, ctx.sender());
    // transfer::public_transfer(key_display, ctx.sender());
    // transfer::public_transfer(keyboard_display, ctx.sender());
    // transfer::public_transfer(kitchen_knife_display, ctx.sender());
    // transfer::public_transfer(laser_display, ctx.sender());
    // transfer::public_transfer(left_arm_display, ctx.sender());
    // transfer::public_transfer(left_arm_retractor_display, ctx.sender());
    // transfer::public_transfer(left_binocular_display, ctx.sender());
    // transfer::public_transfer(left_cuff_display, ctx.sender());
    // transfer::public_transfer(left_ear_display, ctx.sender());
    // transfer::public_transfer(left_leg_display, ctx.sender());
    // transfer::public_transfer(left_skate_display, ctx.sender());
    // transfer::public_transfer(light_bulb_display, ctx.sender());
    // transfer::public_transfer(lighter_display, ctx.sender());
    // transfer::public_transfer(long_shovel_display, ctx.sender());
    // transfer::public_transfer(magnet_display, ctx.sender());
    // transfer::public_transfer(magnet_shoes_display, ctx.sender());
     transfer::public_transfer(mallet_display, ctx.sender());
    // transfer::public_transfer(map_of_south_africa_display, ctx.sender());
    // transfer::public_transfer(map_of_tibet_display, ctx.sender());
    // transfer::public_transfer(match_display, ctx.sender());
    // transfer::public_transfer(megaphone_display, ctx.sender());
    // transfer::public_transfer(metal_fly_swatter_display, ctx.sender());
    // transfer::public_transfer(neck_display, ctx.sender());
    // transfer::public_transfer(net_display, ctx.sender());
    // transfer::public_transfer(north_pole_compass_display, ctx.sender());
    // transfer::public_transfer(note_display, ctx.sender());
    // transfer::public_transfer(notepad_display, ctx.sender());
    // transfer::public_transfer(oil_can_display, ctx.sender());
    // transfer::public_transfer(paper_fan_display, ctx.sender());
    // transfer::public_transfer(parachute_display, ctx.sender());
    // transfer::public_transfer(pencil_display, ctx.sender());
    // transfer::public_transfer(peonies_display, ctx.sender());
    // transfer::public_transfer(pink_envelope_display, ctx.sender());
    // transfer::public_transfer(pink_handkerchief_display, ctx.sender());
    // transfer::public_transfer(pizza_chef_hat_display, ctx.sender());
    // transfer::public_transfer(plastic_fan_display, ctx.sender());
    // transfer::public_transfer(plastic_fly_swatter_display, ctx.sender());
    // transfer::public_transfer(pocket_watch_display, ctx.sender());
    // transfer::public_transfer(pocket_watch_on_chain_display, ctx.sender());
    // transfer::public_transfer(police_id_display, ctx.sender());
    // transfer::public_transfer(pool_tube_display, ctx.sender());
    // transfer::public_transfer(pot_display, ctx.sender());
    // transfer::public_transfer(primroses_display, ctx.sender());
    // transfer::public_transfer(prototype_radar_display, ctx.sender());
    // transfer::public_transfer(pulley_display, ctx.sender());
    // transfer::public_transfer(radar_display, ctx.sender());
    // transfer::public_transfer(red_blow_dryer_display, ctx.sender());
    // transfer::public_transfer(red_cup_display, ctx.sender());
    // transfer::public_transfer(red_dotted_handkerchief_display, ctx.sender());
    // transfer::public_transfer(red_duster_display, ctx.sender());
    // transfer::public_transfer(red_handle_scissors_display, ctx.sender());
    // transfer::public_transfer(red_magnifying_glass_display, ctx.sender());
    // transfer::public_transfer(respirator_display, ctx.sender());
    // transfer::public_transfer(right_arm_display, ctx.sender());
    // transfer::public_transfer(right_arm_retractor_display, ctx.sender());
    // transfer::public_transfer(right_cuff_display, ctx.sender());
    // transfer::public_transfer(right_ear_display, ctx.sender());
    // transfer::public_transfer(right_leg_display, ctx.sender());
    // transfer::public_transfer(rocket_skates_display, ctx.sender());
    // transfer::public_transfer(roses_display, ctx.sender());
    // transfer::public_transfer(safety_scissors_display, ctx.sender());
    // transfer::public_transfer(sail_display, ctx.sender());
    // transfer::public_transfer(saw_display, ctx.sender());
    // transfer::public_transfer(scissors_display, ctx.sender());
    // transfer::public_transfer(screwdriver_display, ctx.sender());
    // transfer::public_transfer(shears_display, ctx.sender());
    // transfer::public_transfer(shoehorn_display, ctx.sender());
    // transfer::public_transfer(skates_display, ctx.sender());
    // transfer::public_transfer(skis_display, ctx.sender());
    // transfer::public_transfer(small_camera_display, ctx.sender());
    // transfer::public_transfer(small_mallet_display, ctx.sender());
    // transfer::public_transfer(sponge_display, ctx.sender());
    // transfer::public_transfer(spoon_display, ctx.sender());
    // transfer::public_transfer(spring_display, ctx.sender());
    // transfer::public_transfer(squeegee_display, ctx.sender());
    // transfer::public_transfer(steel_magnifying_glass_display, ctx.sender());
    // transfer::public_transfer(straw_hat_display, ctx.sender());
    // transfer::public_transfer(surrender_flag_display, ctx.sender());
    // transfer::public_transfer(superbells_display, ctx.sender());
    // transfer::public_transfer(telescope_display, ctx.sender());
    // transfer::public_transfer(telescoping_legs_display, ctx.sender());
    // transfer::public_transfer(teeth_display, ctx.sender());
    // transfer::public_transfer(tie_display, ctx.sender());
    // transfer::public_transfer(toothbrush_display, ctx.sender());
    // transfer::public_transfer(toothpaste_display, ctx.sender());
     transfer::public_transfer(top_secret_gadget_phone_display, ctx.sender());
    // transfer::public_transfer(trick_flower_display, ctx.sender());
    // transfer::public_transfer(two_hands_display, ctx.sender());
    // transfer::public_transfer(two_left_cuffs_display, ctx.sender());
    // transfer::public_transfer(water_cannon_display, ctx.sender());
    // transfer::public_transfer(water_gun_display, ctx.sender());
    // transfer::public_transfer(water_ski_propeller_display, ctx.sender());
    // transfer::public_transfer(welding_mask_display, ctx.sender());
    // transfer::public_transfer(white_handkerchief_display, ctx.sender());
    // transfer::public_transfer(winner_flag_display, ctx.sender());
    // transfer::public_transfer(work_light_display, ctx.sender());
    // transfer::public_transfer(wrench_display, ctx.sender());
    // transfer::public_transfer(yellow_handkerchief_display, ctx.sender());
    // transfer::public_transfer(yoyo_display, ctx.sender());

    
       
    }

    fun gadget_gameplay_items_display<T>(publisher: &Publisher, ctx: &mut TxContext): Display<GadgetGameplayItem<T>> {
        let keys = vector[
            utf8(b"creator"),
            utf8(b"project_url"),
            utf8(b"intellectual_property"),
            utf8(b"category"),
            utf8(b"age_rating"),
            utf8(b"image_url"),
            utf8(b"name"),
            utf8(b"copyright"),
        ];

        let values = vector[
            utf8(b"Gamisodes"),
            utf8(b"https://www.gamisodes.com"),
            utf8(b"Inspector Gadget"),
            utf8(b"Collectable"),
            utf8(b"TV-Y7"),
            utf8(b"{media_url_primary}"),
            utf8(b"{title}"),
            utf8(b"© 2024 Gamisodes & WildBrain. “Inspector Gadget (Classic)” courtesy of DHX Media (Toronto) Ltd. -FR3- Field Communication. All rights reserved."),
        ];

        let mut display = display::new_with_fields<GadgetGameplayItem<T>>(
            publisher, keys, values, ctx
        );

        display.update_version();
        display
    }
}











