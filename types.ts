// Data shapes of the pipeline. Two layers, one source of truth for every side: change a record here and tsc points
// at every place that builds or reads it.
//   out/*.json            written by scripts/build.ts, the one place that reads and joins the game files (Full* types,
//                         plus Spawn, Vendor, Tenement and FurnitureData, which build.ts already writes in their final
//                         shape; recipe sources come from scripts/recipe-sources.ts, furniture from scripts/furniture.ts)
//   viewer/public/data/   written by scripts/build-data.ts from out/ only, read by the viewer (Item, Recipe, Meta ...)
// Fields marked optional are dropped by cleanObj (scripts/shared.ts) when empty, null, false or ''.

/** A resolved item reference: the item's ID and title. When Items.json lacks the ID, `name` is the raw name the
 *  reference carried (or "#<ID>") and `missing` is set. */
export interface Ref { id: number; name: string; missing?: true }
/** An item reference with a quantity (recipe inputs and outputs, action spawns and requirements). */
export interface RefQ extends Ref { q: number }

/** The known Meta blocks of an item, as scripts/shared.ts `parseMeta` summarises them from the game's Meta list.
 *  Unknown blocks appear under their game type name (ItemVariantData ...) as `true`. */
export interface ItemMeta {
  perishable?: { lossPerHour: number; fridgeFactor: number; spoilsTo: Ref | null; disabled: boolean };
  fuel?: { burntime: number; leaves: Ref | null; leavesAmount: number };
  liquid?: { liquid: Ref | null; amount: number; max: number; valueFactor: number; emptyContainer: Ref | null };
  emptyContainer?: { fills: Ref | null };
  quality?: { fixed: boolean; quality: number };
  grow?: { time: number; dayOnly: boolean };
  charge?: { ammo: number; max: number; uses: Ref[]; drainPerMin: number };
  animal?: { fullGrownAge: number; grownItem: Ref | null; maxHunger: number };
  package?: { capacity: number; valueFactor: number; allowed: string[] };
  /** Item group members: any of them can stand in for this item in recipes. */
  group?: ItemGroupMember[];
  [blockType: string]: unknown;
}

/** One member of an item group (ItemGroupData). `craftingValues` is the game's object as Items.json has it. */
export interface ItemGroupMember {
  item: Ref | null; tag: string;
  craftingValues: { qualityFactor: number; skillFactor: number; failFactor: number; craftTimeFactor: number; addSMV: number; useOutputTag: string };
}

/** A recipe input/output entry. `n` is set only when the item ID is not in Items.json (the raw name from the recipe). */
export interface RecipeEntry { id: number; q: number; n?: string }

/** One action of an item, from the raw Actions list. */
export interface ActionDetail {
  type?: string; name?: string; amount?: number; destroy?: boolean; special?: string;
  spawns?: { id: number; q: number }[]; requires?: { id: number; q: number }[];
}

/** [spawn table ID, 'c' common | 'r' rare, weight = how often the ID repeats in that list] */
export type FoundIn = [number, 'c' | 'r', number];

export interface Item {
  id: number; name: string;
  cats: string[]; actions: string[];
  /** Effect name -> amount, as out/items-full.json has them (Nutrition, Thirst, Nicotine, ...). */
  effects: Record<string, number>;
  /** Meta blocks as in out/items-full.json; item references in them are `Ref` objects the viewer links. */
  meta: ItemMeta;
  producedBy: number[]; usedIn: number[]; failOf: number[]; foundIn: FoundIn[]; spoilsFrom: number[];
  value?: number; stack?: number; desc?: string; sprite?: string; prefab?: string; material?: string;
  actionDetail?: ActionDetail[]; upgrades?: string[]; soldBy?: string[]; boughtBy?: string[];
  /** Checkouts (Market IDs) whose goods include it. */
  soldAt?: string[];
  nutrition?: number; thirst?: number;
  /** Recipe sources (data/sources.json) this item is. */
  teaches?: number[];
  /** Blueprint keys (data/furniture.json) whose resources consume this item; furniture keys whose dismantling yields it. */
  usedInBlueprints?: string[]; dismantledFrom?: string[];
  /** Blueprint readables: what reading gives, with the pool size (the pool itself is the blueprints whose `sources`
   *  name this item and category). */
  givesBlueprints?: GivesBlueprints[];
}

/** One blueprint pick of a readable (ItemReadable.GiveBlueprints): up to `max` blueprints from the pool of `category`
 *  ('Start' = the controller's start list, 'main' = its main list, else a category of the controller). `pool` is the
 *  number of distinct blueprints in it; the game leaves out what the player already holds (runtime, ignored here). */
export interface GivesBlueprints { category: string; max: number; pool: number }

export interface Recipe {
  in: RecipeEntry[]; out: RecipeEntry[]; fail: RecipeEntry[];
  id: number; name: string; type: string;
  failChance?: number; skill?: string; minSkill?: number; hardMin?: boolean; time?: number;
  req?: boolean; tags?: string[]; reqCond?: string[]; exclCond?: string[];
  variantCat?: string; variantAmt?: number; stolenOnly?: boolean;
  /** Recipe sources (data/sources.json) that can give it. */
  src?: number[];
}

/** A recipe source as the viewer gets it: FullRecipeSource with the readable as an item ID. */
export type RecipeSource = Omit<FullRecipeSource, 'item'> & { item?: number };

export type SpawnKind = 'shop' | 'container' | 'unused' | 'unknown';

export interface Spawn {
  id: number; name: string; kind: SpawnKind;
  uses: { vendor: number; container: number; pickup: number };
  common: number[]; rare: number[];
  /** IDs of the vendors this table stocks. */
  vendors: string[];
  /** IDs of the checkouts whose shelves or spawners roll from it. */
  markets?: string[];
  mixed?: true;
}

/** The Stalburg wiki page of a vendor or a furniture shop (scripts/vendors-wiki.json, scripts/furniture-shops-wiki.json,
 *  both checked by hand): `kind` says whether the page is the shop's own, the location it is in, or its NPC's. */
export interface WikiRef { url: string; title: string; kind: 'shop' | 'location' | 'npc'; note?: string }

/** A scene Trade (scripts/vendors.ts). `wiki`: its Stalburg wiki page; `wikiName`: the wiki's name for it when the
 *  wiki file gives one (it differs from the game's). */
export interface Vendor {
  id: string; name: string; scene: string;
  title?: string; owner?: { id: number; name: string }; special?: boolean; object?: string;
  wiki?: WikiRef; wikiName?: string;
  table?: number; tableName?: string; custom?: [number, number][];
  buy?: number; sell?: number; buyCur?: string; sellCur?: string; fixedPrices?: boolean;
  cash?: [number, number]; cashShared?: boolean;
  /** Monday..Sunday: [opens, closes] hour. */
  hours?: [number, number][]; autoHours?: boolean;
  buys?: string[]; refuses?: string[]; stolen?: number; destroysBought?: boolean;
  restock?: string; stacks?: [number, number]; perStack?: [number, number]; rareChance?: number;
  certificate?: { id: number; generic: boolean };
  test?: boolean;
}

/** A checkout (the game's MarketShop, scripts/vendors.ts joinMarkets): the player lays goods of `owner` on its conveyor
 *  and pays the sum of their sale values x `priceFactor` in `currency` (RM = OC x 0.1), rounded once, at least 1. It has
 *  no stock of its own. `retain`: paid goods whose use leaves items worth at least this many OC stay the owner's, usable
 *  in place (0 = all goods); `bag`: the bag item it packs the goods into; `vendors`: vendors of the same owner and scene. */
export interface Market {
  id: string; name: string; scene: string; object: string; currency: string; priceFactor: number;
  owner?: { id: number; name: string }; retain?: number; bag?: Ref; lockMessage?: string; vendors?: string[]; test?: boolean;
  /** Its goods (scripts/vendors.ts joinMarkets): the spawn tables its shelves and spawners roll from, the fixed items with
   *  the number of shelves, spawners and placed items that hold them, table names no table has, and how many of each. */
  tables?: number[]; stock?: [number, number][]; missingTables?: string[];
  goods?: { shelves: number; spawners: number; items: number };
}

/** `start`: the tier a new game starts at, when not 0 (scripts/tenement.ts START_TIERS). */
export interface UpgradeCategory { id: string; group: string; label: string; rent: boolean; tiers: string[]; start?: number }

export interface Upgrade {
  name: string; cat: string; tier: number; tierName: string;
  hours?: number; oc?: number; rm?: number; value?: number;
  items?: [number, number][]; requires?: string[]; contractors?: string[]; anyContractor?: boolean;
}

/** A tenement resident the player can rent to (gamedata/TenementUpgrades.json residents, where and how from
 *  gamedata/Residents.json; scripts/tenement.ts). */
export interface Resident {
  /** `npc`: the NPC ID (NPCBehavior.json). */
  name: string; npc: number;
  /** Base rent per rent period; 0 = that currency is never paid. */
  oc: number; rm: number;
  /** Accepted apartment sizes, in order. */
  sizes: ('Small' | 'Medium' | 'Large')[];
  /** Minimum upgrade tiers: [category ID of tenement.categories, tier]; only demands above tier 0. */
  needs: [string, number][];
  /** `with`: names of the people who move in with them; `events`: number of tenement events; `furniture`: the
   *  furniture prefab set. */
  with?: string[]; events?: number; noEvict?: true; noUpgrade?: true; dialogueActor?: string; furniture?: string;
  /** Active placements in regular scenes (inactive copies and the developer test maps left out): scene and GameObject path. */
  where?: { scene: string; object: string }[];
  /** Conversation titles with an option that rents to them ("Resident/Agnes Takala"), from the dialogue database. */
  talk?: string[];
  /** Already lives in this apartment when a new game starts (Malone Petronis). */
  startsIn?: number;
  /** Moved in by a scene relay instead of dialogue (Crazy Neighbor): the apartment it rents. */
  relayTo?: number;
}

export interface Tenement {
  categories: UpgradeCategory[]; upgrades: Upgrade[];
  /** max: category ID -> highest tier this contractor can build (null = no contractor check). */
  contractors: { name: string; max: Record<string, number | null> }[];
  /** Sorted by name. */
  residents: Resident[];
}

export interface GameStamp { version: string | null; steamBuild: string | null; updated: string | null }

export interface Meta {
  generated: string;
  game: GameStamp & { dataCopied: string | null };
  /** Ready-made footer label, "Obenseuer 0.5.13 (Steam build 26179069, 2026-10-24)" or "game version unknown". */
  versionLabel: string;
  /** [value, count], most frequent first. */
  categories: [string, number][]; actionTypes: [string, number][]; stations: [string, number][];
  /** Furniture categories with their counts, in the game's enum order (Furniture.Category), trains included. */
  furnitureCategories: [string, number][];
}

// ---- furniture (out/furniture.json from scripts/furniture.ts; viewer/public/data/furniture.json is the same, minified).
// Furniture, blueprints and groups are keyed by their addressable asset path minus "Prefabs/Building System/" (trains:
// minus "Prefabs/"): "Furniture/Bathroom/Bathroom Cabinet", "Blueprints/Growing/Barrel", "Furniture Groups/Barrel",
// "Vehicles/Flat Wagon". Shops are keyed "<first scene>|<GameObject path>". Shop lists go by their asset name.
// Game rules: docs/furniture-research.md section 2.

/** A blueprint resource or a dismantle yield: an item, a furniture, or any member of a group (dismantling into a group
 *  gives its first member). `q` is the amount; furniture and group entries are satisfied by one owned copy (2.4). */
export type FurnitureResource = { item: Ref; q: number } | { furniture: string; q: number } | { group: string; q: number };

/** What one restock of a shop list can stock (2.6): `minDistinct`..`maxDistinct` different furniture, each with
 *  `stackMin`..`stackMax` units (split over skins). Repeats within the list are accounted for (scripts/furniture.ts
 *  stockRange); fewer when an earlier list of the same shop already stocked one. */
export interface StockRange { minDistinct: number; maxDistinct: number; stackMin: number; stackMax: number }

/** Where a scene source sits: its scenes, its GameObject path, how many identical instances (when more than one);
 *  `inactive`: disabled in its scene (test objects). */
export interface FurniturePlace { scenes: string[]; object: string; count?: number; inactive?: true }

/** One way to get a blueprint (`Blueprint.sources`) or a furniture (`Furniture.obtainedBy`).
 *  drop        a FurnitureBlueprintSpawner draws it from the controller's start list (about 90 % of the draws while that
 *              list is not used up) or its main list; which spawners and where: FurnitureController.spawners
 *  readable    reading `item` gives up to `max` picks from the pool of `category` (size `pool`), see GivesBlueprints
 *  pickup      a CollectibleTaskItem (blueprint) or FurnitureCollectable (furniture; all are inactive test objects)
 *  package     a CollectiblePackage holding it
 *  relay       logic_taskitem_control (blueprint) or PlaceFurniture (furniture, `area` = the build area it lands in)
 *  mail        logic_mail_sender / logic_mail_bundle_sender (`sender`, `mailName`, `target`), or a RandommailSender
 *              parcel (`sender`, `mailNames`, `mailType` = the random mail type)
 *  achievement the reward of a Steam achievement, by mail (`parcel`: to the parcel locker)
 *  craft       made at a worktable from `blueprint`
 *  shop        stocked by `shop` from its list `list`
 *  display     a display model in `shop` (data in FurnitureShop.displays)
 *  dismantle   dismantling furniture `from` yields `q` of it */
export type FurnitureSource =
  | { kind: 'drop'; list: 'start' | 'main' }
  | { kind: 'readable'; item: Ref; category: string; max: number; pool: number }
  | ({ kind: 'pickup' | 'package'; amount?: number } & FurniturePlace)
  | ({ kind: 'relay'; amount?: number; area?: string } & FurniturePlace)
  | ({ kind: 'mail'; sender: string; mailName?: string; mailNames?: string[]; target?: string; mailType?: string } & Partial<FurniturePlace>)
  | { kind: 'achievement'; name: string; enabled: boolean; reward?: string; parcel?: true }
  | { kind: 'craft'; blueprint: string }
  | { kind: 'shop'; shop: string; list: string; stock: StockRange }
  | { kind: 'display'; shop: string; count?: number }
  | { kind: 'dismantle'; from: string; q: number };
export type FurnitureSourceKind = FurnitureSource['kind'];

/** A furniture (or train) the player can own in build mode. `name`: the title, or the asset name when the title is
 *  empty. Prices are the base prices before the difficulty multiplier; a shop charges both at its buyPercent. */
export interface Furniture {
  key: string; name: string; class: 'Furniture' | 'Train'; category: string; priceOC: number; priceRM: number;
  details?: string; trash?: true;
  /** Build areas it may not be placed in (empty = anywhere). */
  restrictedAreas?: string[];
  /** Skins 1..n (skin 0 is the furniture itself); an empty title means the furniture's title. */
  skins?: { id?: string; title?: string }[];
  /** What dismantling gives; absent when nothing. `dismantlesToNothing`: the worktable dismantles it (its
   *  dismantleItems is not empty) but every entry yields nothing (amount 0); without both it cannot be dismantled. */
  dismantle?: FurnitureResource[]; dismantlesToNothing?: true;
  /** The blueprint that makes it. */
  blueprint?: string;
  /** Blueprints that consume it (directly or as a member of a group); furniture whose dismantling yields it. */
  usedInBlueprints?: string[]; dismantledFrom?: string[];
  /** Shops whose lists stock it (one entry per list); shops that buy it from the player (FurnitureShop.CanSell). */
  soldBy?: { shop: string; list: string }[]; boughtBy?: string[];
  obtainedBy?: FurnitureSource[];
}

/** A worktable blueprint. `name`: its item name. `amount`: furniture made per craft (the game's 0 counts as 1).
 *  `processTime`: game minutes as stored; `baseSeconds`: TaskItemBlueprint.GetProcessTime() (processTime x 60, or 60
 *  when 0), before skill (scripts/furniture.ts craftingSeconds). */
export interface Blueprint {
  key: string; name: string; result: string; amount: number; resources: FurnitureResource[];
  processTime: number; baseSeconds: number;
  /** Game seconds at skill 10 (PlayerStats.maxLevel): craftingSeconds(blueprint, MAX_SKILL), half of `baseSeconds`
   *  with a skill, `baseSeconds` with skill None; without mushroom effects and the difficulty's crafting speed. */
  skill10Seconds: number;
  skill: string; minimumSkill: number;
  sources: FurnitureSource[];
}

export interface FurnitureGroup { key: string; title: string; members: string[] }

/** One FurnitureShopItemsList as a shop uses it: `min`/`max` = minItemAmount/maxItemAmount, `maxStack` =
 *  maxItemStackAmount, `furniture` = its distinct entries. */
export interface FurnitureShopList { name: string; min: number; max: number; maxStack: number; furniture: string[]; stock: StockRange }

/** Identical InteractableFurnitureDisplays of a shop, merged (`count` when more than one). `currency`: Both = the
 *  shop's two prices, OC = OC + RM x 10, RM = RM + OC / 10 (2.6). */
export interface FurnitureShopDisplay { furniture: string; skin: number; currency: 'Both' | 'OC' | 'RM'; addAsItem?: true; purchase?: true; infiniteStock?: true; count?: number;
  /** addAsItem: what the shop's checkout charges for the flatpack, in the checkout's currency (scripts/furniture.ts checkoutPrice). */
  checkoutPrice?: number }

/** A FurnitureShop or TrainShop scene object. `title`: the game's title, or the GameObject name when that is empty
 *  (`untitled`). `label`: the name to show: the game's title, else the wiki's name for the shop, else the GameObject
 *  name and the scene, "Relay_custom_painting (Test Map Empty)". `testMap`: a test object: every scene of it is a test
 *  map (a name starting with "Test", as for vendors), or its GameObject path has a segment "Test" (the debug TrainShop
 *  ".../Train Shop/Test" in Open Sewer Mines). sellPercent = what it pays, buyPercent = what it charges (both currencies at
 *  once). `restock` in game seconds. Sell rule (boughtBy): `buysAnything`, or `canSellItems` and the furniture is in
 *  `lists` (with `sellItemsSameAsBuy`) or in `sellLists`; a TrainShop buys trains. */
export interface FurnitureShop {
  key: string; scenes: string[]; object: string; class: 'FurnitureShop' | 'TrainShop'; title: string; label: string; untitled?: true;
  wiki?: WikiRef;
  guid: string; sellPercent: number; buyPercent: number;
  cash: { oc: [number, number]; rm: [number, number] };
  restock: { everyDay: true } | { min: number; max: number };
  lists: FurnitureShopList[];
  buysAnything?: true; canSellItems?: true; sellItemsSameAsBuy?: true; sellLists?: string[];
  displays?: FurnitureShopDisplay[]; inactive?: true; testMap?: true;
  /** The checkout (Market ID) where the flatpacks of its addAsItem displays are paid: the scene's MarketShop of the
   *  displays' owner. */
  checkout?: string;
}

/** A blueprint pool of the FurnitureBlueprintController: the ListMain's name, its distinct blueprints, and the number
 *  of list entries (a blueprint listed twice weighs double in a random pick). */
export interface BlueprintPool { list: string; blueprints: string[]; entries: number }

/** The scene-wide FurnitureBlueprintController (one configuration in every scene): spawners draw from `start`, then
 *  `main`; readables name a category ('Start' = start, '' = main, else one of `categories`). `spawners`: the active
 *  FurnitureBlueprintSpawner instances (`count`) and the scenes they are in, which every 'drop' source refers to. */
export interface FurnitureController {
  start: BlueprintPool; main: BlueprintPool; categories: (BlueprintPool & { name: string })[];
  spawners: { count: number; scenes: string[] };
}

/** out/furniture.json. `controller` is null when gamedata/Furniture.json is missing. */
export interface FurnitureData {
  furniture: Furniture[]; blueprints: Blueprint[]; groups: FurnitureGroup[]; shops: FurnitureShop[];
  controller: FurnitureController | null;
}

/** GivesBlueprints as out/items-full.json carries it, with the pool's blueprint keys. */
export interface FullGivesBlueprints { category: string; max: number; pool: string[] }

/** One recipe of out/recipes.json (all recipes, Debug included, in file order). Values are the game's own: `name`
 *  may be missing, `skill` may be "None"; build-data.ts normalises them for the viewer. `time` is in seconds. */
export interface FullRecipe {
  id: number; name: string; type: string; input: RefQ[]; output: RefQ[]; fail: RefQ[];
  failChance?: number; skill?: string; minSkill?: number; hardMin?: boolean; time?: number; recipeRequired?: boolean; tags: string[];
  reqCond: string[]; exclCond: string[]; variantCat?: string; variantAmt?: number; stolenOnly?: boolean;
  /** Indexes into out/recipe-sources.json of everything that can give this recipe. */
  sources: number[];
}

/** Summary of a recipe as scripts/build.ts embeds it in out/items-full.json. */
export type FullRecipeSummary = Pick<FullRecipe, 'id' | 'name' | 'type' | 'input' | 'output' | 'fail' | 'failChance' | 'skill' | 'minSkill' | 'time' | 'recipeRequired' | 'tags' | 'sources'>;

export type RecipeSourceKind = 'readable' | 'book' | 'pickup' | 'dialogue' | 'mail';

/** One thing in the game that gives recipes (scripts/recipe-sources.ts, docs/recipe-unlocks-research.md): a readable
 *  item, a world recipe book or pickup, a dialogue line, a mail. It gives all of `explicit`, then `max` random picks
 *  from `pool` (-1 = the whole pool). out/recipe-sources.json; `id` is the index in that list. */
export interface FullRecipeSource {
  id: number; kind: RecipeSourceKind;
  explicit: number[]; pool: number[]; max: number;
  /** The readable item. */
  item?: Ref;
  /** Scene object name (book, pickup), mail label, dialogue conversation ("Resident/Malone Petronis"). */
  label?: string;
  /** Scenes the object is placed in (book, pickup, mail); `count` instances over all of them when more than one. */
  scenes?: string[]; count?: number;
  /** Only in an Addressables prefab, scene unknown / every instance is inactive in its scene. */
  prefab?: true; inactive?: true;
  /** Dialogue: the NPC the player talks to, the entry ID and its condition. */
  speaker?: string; entry?: number; condition?: string;
}

/** One action of an item in out/items-full.json, with item references resolved. */
export interface FullAction {
  type?: string; name?: string; amount?: number; destroy?: boolean; special?: string;
  spawns?: RefQ[]; requires?: RefQ[];
}

/** A spawn table an item appears in: table ID and display name, which of its two lists, and how often the item
 *  repeats in that list (weight). In table order, common before rare. */
export interface FullFoundIn { id: number; name: string; list: 'common' | 'rare'; weight: number }

/** A vendor reference: the vendor ID of vendors.json and its display name. */
export interface VendorRef { id: string; name: string }

/** One entry of out/items-full.json, the per-item sheet scripts/build.ts writes and build-data, check and the wiki scripts read. */
export interface FullItem {
  ID: number; Title: string; Categories: string[]; BaseValue: number; Stackable: number; Description?: string;
  Sprite?: string; Prefab?: string; Material?: string;
  /** Action types (Food, Drink, ...; the raw $type for actions without a Type). */
  ActionTypes: string[];
  Actions: FullAction[];
  /** Effect name -> amount (Nutrition, Thirst, ...). */
  Effects: Record<string, number>;
  Meta: ItemMeta;
  /** Non-Debug recipes that output, consume, or output on failure this item (one entry per matching recipe line). */
  ProducedBy: FullRecipeSummary[]; UsedIn: FullRecipeSummary[]; FailOf: FullRecipeSummary[];
  FoundIn: FullFoundIn[];
  /** Perishable items that spoil into this one. */
  SpoilsFrom: Ref[];
  SoldBy: VendorRef[]; BoughtBy: VendorRef[];
  /** Checkouts whose goods include it (scripts/vendors.ts joinMarkets). */
  SoldAt: VendorRef[];
  /** Names of the tenement upgrades that need this item. */
  Upgrades: string[];
  /** Indexes into out/recipe-sources.json of this item's readable actions that give recipes. */
  Teaches: number[];
  /** Blueprint keys whose resources consume this item; furniture keys whose dismantling yields it (out/furniture.json). */
  UsedInBlueprints: string[]; DismantledFrom: string[];
  /** Blueprint readables (MaxBlueprints > 0): one entry per category read. */
  GivesBlueprints: FullGivesBlueprints[];
}
