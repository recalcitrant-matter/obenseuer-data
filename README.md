# Obenseuer data

Item, recipe, vendor, spawn-table, tenement-upgrade, tenant and furniture data from the game [Obenseuer](https://store.steampowered.com/app/951240/Obenseuer/) (Loiste Interactive), as the [Obenseuer Data Viewer](https://obenseuer-viewer.pages.dev/) shows it.

**Current data:** Obenseuer 0.5.13 (Steam build 26179069, 2026-10-24) · game files copied 2026-10-25 · built 2026-10-29

## Report wrong data

The data is extracted automatically and is not always right, above all where it comes from the game's scene files (vendors, opening hours, tenement upgrades, tenants, furniture shops, where recipes are learned). If something differs from what you see in the game, [open an issue](https://github.com/recalcitrant-matter/obenseuer-data/issues/new). The "Report" links in the viewer open one pre-filled with the page and the data version. Please say what the viewer shows, what the game shows, and where you saw it.

## Files

`data/` holds the files the viewer loads, one JSON file per kind. Their record shapes are in [types.ts](types.ts) (`Item`, `Recipe`, `Spawn`, `Vendor`, `Tenement`, `RecipeSource`, `FurnitureData`, `Meta`).

| File | Content |
|---|---|
| [furniture.json](data/furniture.json) | Furniture, worktable blueprints, furniture shops, and where each comes from |
| [items.json](data/items.json) | Every item: categories, value, stack size, actions and effects, where it is found, sold and used |
| [markets.json](data/markets.json) | Checkouts (supermarket cash registers): owner, price factor, currency, and the goods on the owner's shelves |
| [meta.json](data/meta.json) | Game version, build date, category and station counts |
| [recipes.json](data/recipes.json) | Every recipe: station, ingredients, results, fail output, time, skill, tags |
| [sources.json](data/sources.json) | What gives recipes: readables, world books, pickups, dialogue, mail |
| [spawns.json](data/spawns.json) | Spawn tables: shop stock lists and container loot, common and rare items |
| [tenement.json](data/tenement.json) | Tenement upgrade categories and tiers, contractors, renters |
| [vendors.json](data/vendors.json) | Vendors: prices, currencies, opening hours, restock, stock and what they buy |

Prices are in Open Sewer Coins (OC) or the tenement's RM, times in seconds (recipes), hours (upgrades) or game minutes (blueprint `processTime`). Each push replaces the files with those of the current game version, so `git log -p data/` shows what an update changed.

## Notice

Unofficial fan data, not affiliated with or endorsed by Loiste Interactive. The game content (names, descriptions, numbers) belongs to Loiste Interactive. Item icons and other game assets are not included. If Loiste Interactive wants this data taken down, it will be.
