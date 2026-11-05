# ReTech AI — Source snapshot and replay

This bundle retains original public factual JSON/CSV registries, minimal factual manufacturer HTML extracts, quote observations and scripts. Manufacturer marketing articles and website navigation are not redistributed. Original downloaded page SHA-256 values and each retained extract SHA-256 appear in SOURCE_SNAPSHOT_INDEX.json. Every model retains its original URL and date semantics.

## Offline replay

```bash
python scripts/build_catalog.py --raw-dir raw --prices prices_enriched.json --output-dir replay
python scripts/validate_dataset.py --raw-dir raw --data-dir replay
```

The generated replay/devices.json must have the same SHA-256 as data/devices.json. The original data was captured on 2026-11-02.

## Optional refresh

```bash
python scripts/acquire_all.py --raw-dir raw --refresh
```

Refreshing replaces cached source facts with original current pages/tables, so the data can change. Review source schemas and date semantics before rebuilding. The preserved asus-2020-verified-facts.json documents a direct-download failure and the original official-page verification. This snapshot is an academic catalog of models/SKUs, not verified physical stock or completed sales.
