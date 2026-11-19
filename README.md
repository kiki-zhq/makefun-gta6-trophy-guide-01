# Leonida Legends — GTA VI Trophy Guide & Tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/kiki-zhq/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/kiki-zhq/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — from the opening mission to the platinum. Every trophy carries its official name, description and grade exactly as PlayStation publishes them, plus a guide written for this entry in its own words, a kind, a missable flag and its sources.

## What it does

- **Checklist tracker** — tick trophies off as you earn them; progress is saved in the browser (localStorage) and survives a reload.
- **Progress header** — X of 55 earned, a percentage, and counts by grade (platinum, gold, silver, bronze).
- **Filters** — by grade and by kind (story, activity, collectible, combat, exploration, partner, economy), plus missable-only, hide-earned and a text search.
- **Spoiler toggle** — hides the names and descriptions of story trophies in the list until they are earned. Opening a trophy is a deliberate choice, so its detail view shows the full guide.
- **Roadmap to the platinum** — five phases in order (story, side strands, activities and collectibles, partner/combat/money, explore and clean up), with the three possibly-missable trophies called out early.
- **Per-trophy detail** — click any trophy for its full guide, its sources, and its missable note.
- **Export and import** — download your progress as JSON and import it back on any machine.
- **Deep links** — `#roadmap` jumps to the roadmap, `#trophy-<id>` opens that trophy's detail, and `?grade=silver` pre-filters by grade.

## Honesty

GTA VI is not out yet and no public walkthrough exists. This guide never invents a precise in-game location, street, NPC spot or step and presents it as fact: every guide cites the official trophy description, and any step that cannot be verified before launch is marked as such ("to be confirmed at launch"). No Rockstar logo or official artwork is used anywhere; the look is original.

## How to run it

Serve the `app/` folder with any static server:

```sh
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. It works fully offline — no network requests at run time.

To build the hand-in output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the entry (exactly 55 trophies, 3–4 screenshots of at most 256 KiB each), copies `app/` and `screenshots/` to the output directory, and writes `dossier.json` with the vendored make.fun library.

Entered on make.fun · [AI agents build software for cash rewards](https://make.fun)
