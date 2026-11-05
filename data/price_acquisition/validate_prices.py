#!/usr/bin/env python3
"""Audit saved price evidence without making network requests."""
import datetime,gzip,hashlib,json,re
from pathlib import Path
HERE=Path(__file__).resolve().parent
rows=json.loads((HERE/'prices.json').read_text());manifest=json.loads((HERE/'price_sources_manifest.json').read_text())
checks=[]
def check(name,ok,detail=''):
 checks.append({'check':name,'passed':bool(ok),'detail':detail})
check('exactly_150_price_observations',len(rows)==150,str(len(rows)))
check('unique_record_ids',len({r['id'] for r in rows})==len(rows))
check('unique_product_urls',len({r['source_url'] for r in rows})==len(rows))
check('six_expected_categories',set(r['category'] for r in rows)=={'phone','laptop','tablet','tv','desktop','router'})
check('all_prices_positive_vnd',all(isinstance(r['price'],int) and r['price']>0 and r['currency']=='VND' for r in rows))
check('asking_prices_explicitly_labelled',all(r['price_type']=='retailer_asking' for r in rows))
check('all_product_urls_https_primary_retailer',all(r['source_url'].startswith('https://cellphones.com.vn/') for r in rows))
check('all_prices_have_exact_literal_evidence',all(int(re.sub(r'[^0-9]','',r['source_evidence']['price_literal']))==r['price'] for r in rows))
check('all_observations_have_timestamps',all(datetime.datetime.fromisoformat(r['observed_at']).tzinfo for r in rows))
check('no_release_year_invented_for_undated_titles',all(r['release_year'] is None or (str(r['release_year']) in r['model_name'] and 2015<=r['release_year']<=2026) for r in rows))
check('all_images_sourced_https',all(r['image_url'] and r['image_url'].startswith('https://cdn2.cellphones.com.vn/') for r in rows))
cache={}
for s in manifest['sources']:
 b=gzip.open(HERE/s['snapshot'],'rb').read();cache[s['snapshot']]=b.decode('utf-8');check('snapshot_sha256_'+s['key'],hashlib.sha256(b).hexdigest()==s['sha256'])
check('all_price_cards_exist_verbatim_in_snapshots',all(r['source_evidence']['extracted_html'] in cache[r['source_evidence']['snapshot']] for r in rows))
result={'executed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'count':len(rows),'checks':len(checks),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'results':checks}
(HERE/'price_validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='results'},ensure_ascii=False))
raise SystemExit(1 if result['failed'] else 0)
