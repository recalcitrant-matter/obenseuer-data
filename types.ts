// Data shapes of the pipeline. Two layers, one source of truth for every side: change a record here and tsc points
// at every place that builds or reads it.
//   out/*.json            written by scripts/build.ts, the one place that reads and joins the game files (Full* types,
//                         plus Spawn, Vendor and Tenement, which build.ts already writes in their final shape;
//                         recipe sources come from scripts/recipe-sources.ts)
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
  group?: { item: Ref | null; tag: string; craftingValues: Record<string, unknown> }[];
  [blockType: string]: unknown;
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
  nutrition?: number; thirst?: number;
  /** Recipe sources (data/sources.json) this item is. */
  teaches?: number[];
}

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
  mixed?: true;
}

export interface Vendor {
  id: string; name: string; scene: string;
  title?: string; owner?: { id: number; name: string }; special?: boolean; object?: string;
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
}

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
  /** Names of the tenement upgrades that need this item. */
  Upgrades: string[];
  /** Indexes into out/recipe-sources.json of this item's readable actions that give recipes. */
  Teaches: number[];
}
