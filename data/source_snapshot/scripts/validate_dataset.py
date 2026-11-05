#!/usr/bin/env python3
"""Independent integrity/provenance audit. Does not claim market-price accuracy."""
from pathlib import Path
import json,csv,re,ast,html,collections,hashlib,argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--raw-dir',type=Path,default=Path(__file__).resolve().parent)
parser.add_argument('--data-dir',type=Path,default=None)
args=parser.parse_args();P=args.raw_dir.resolve();O=(args.data_dir or P).resolve()
D=json.loads((O/'devices.json').read_text())
Q=json.loads((O/'prices_joined.json').read_text())
checks=[]
def check(name,result,detail=''):
 checks.append({'name':name,'passed':bool(result),'detail':detail})
 if not result:raise AssertionError(name+': '+str(detail))
check('Exactly 1,000 catalog records',len(D)==1000,str(len(D)))
check('Unique stable record IDs',len({x['id'] for x in D})==1000)
check('Unique category/brand/name display identities',len({(x['category'],x['brand'],x['name']) for x in D})==1000)
check('Required six categories',set(x['category'] for x in D)=={'phone','laptop','tablet','desktop','router','tv'})
check('All years sourced within 2015–2026',all(isinstance(x['release_year'],int) and 2015<=x['release_year']<=2026 and x['year_basis'] for x in D))
check('No exact full date after capture cutoff',all(not x['release_date'] or x['release_date']<='2026-11-02' for x in D))
check('Every record has original source locator',all(x['source_url'].startswith('https://') and x['source_record_id'] and x['source_dataset_url'].startswith('https://') for x in D))
check('No replacement characters in factual records',all('\ufffd' not in json.dumps(x,ensure_ascii=False) for x in D))
check('No duplicate brand case labels',len({x['brand'].casefold() for x in D})==len({x['brand'] for x in D}))
check('No invented rating/sales/inventory fields',all(not any(k in x for k in ['rating','review_count','sold_count','stock_quantity']) for x in D))
check('Missing prices remain null',all(x['price'] is None for x in D if not x['quote_ids']))
by_quote={x['id']:x for x in Q}
check('Every model price references a retained real quote',all(all(qid in by_quote for qid in x['quote_ids']) for x in D))
check('Quoted amounts and currency coherent',all(x['price'] is None or any(by_quote[qid]['price']==x['price'] and by_quote[qid]['currency']==x['price_currency'] for qid in x['quote_ids']) for x in D))
check('No negative/non-numeric observed price',all(isinstance(q['price'],(int,float)) and q['price']>0 and q['currency']=='VND' and q['source_url'].startswith('https://') and q['observed_at'] for q in Q))
check('No fake release day for year-only records',all(x['release_date'] is None for x in D if x['year_basis']!='market_availability_date'))
# Independent checks back to original retained registry entries.
comp={x['pd_id']:x for x in json.loads((P/'computers-raw.json').read_text())}
tv={x['pd_id']:x for x in json.loads((P/'tv-raw.json').read_text())}
epa=[x for x in D if x['source_name']=='US EPA ENERGY STAR']
for x in epa:
 source=(tv if x['category']=='tv' else comp)[x['source_record_id']]
 check('EPA model/date '+x['id'],source['model_number']==x['model'] and source['date_available_on_market'][:10]==x['release_date'])
# GSMArena mirror retains one physical line per CSV record; line locators are
# checked against logical row index and original model/launch information.
def decode(s):
 if str(s).startswith(('b\"',"b'")):
  try:
   v=ast.literal_eval(s)
   if isinstance(v,bytes):return v.decode('utf-8','replace')
  except Exception:pass
 return str(s or '').strip()
with (P/'gsm-raw.csv').open(newline='',encoding='utf-8-sig') as f:gsm={str(i):r for i,r in enumerate(csv.DictReader(f),2)}
for x in D:
 if not x['source_name'].startswith('GSMArena'):continue
 r=gsm[x['source_record_id']];name=decode(r['Model Name']);status=decode(r['Status']);announced=decode(r['Announced'])
 year=re.search(r'Released\s+(20\d{2})',status) or re.search(r'\b(20\d{2})\b',announced)
 check('GSMArena name/year '+x['id'],name in x['name'] and year is not None and int(year[1])==x['release_year'])
# Manufacturer section and router announcement factual consistency.
def plain(t):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',t))).strip()
for x in D:
 if x['source_name']=='Apple Support':
  slug,title,model=x['source_record_id'].split(':',2)
  body=(P/('apple-'+slug+'-raw.html')).read_text()
  parts=re.split(r'<h2[^>]*>(.*?)</h2>',body,flags=re.S)
  valid=False
  for i in range(1,len(parts),2):
   if plain(parts[i])!=title:continue
   seg=plain(parts[i+1]);ym=re.search(r'Year(?: introduced)?:\s*(20\d{2})',seg) or re.search(r'\b(20\d{2})\b',title)
   if ym and int(ym[1])==x['release_year'] and (all(code in seg for code in model.split(', ')) or model==title):valid=True
  check('Apple source section/year '+x['id'],valid)
 if x['category']=='router':
  key=x['source_record_id'].split(':',1)[0]
  f=P/('tplink-'+key+'-raw.html')
  if not f.exists():f=P/('router-extra-'+key+'-raw.html')
  if f.exists():valid=x['model'] in plain(f.read_text())
  else:valid=x['model'] in [m['model'] for m in json.loads((P/'asus-2020-verified-facts.json').read_text())['models']]
  check('Router named in original announcement '+x['id'],valid)
# Semantic invariants are intentionally independent of the builder's name regex.
check('Coolpad smartphone regression',all(x['category']=='phone' for x in D if x['brand'].lower()=='coolpad'))
check('Named Apple device families have expected categories',all((x['category']=='phone' if 'iPhone' in x['name'] else x['category']=='tablet' if 'iPad' in x['name'] else x['category']=='laptop' if 'MacBook' in x['name'] else x['category']=='desktop') for x in D if x['source_name']=='Apple Support'))
large_phone_review=[];small_tablet_flags=[]
reviewed_large_phones={'Samsung Galaxy S26 Ultra 5G 12GB 256GB','Samsung Galaxy S25 Ultra 5G 12GB 512GB','Xiaomi POCO F9 Ultra 5G 12GB 256GB','Xiaomi Mi 11','Xiaomi Black Shark 3 Pro','vivo NEX 3S 5G','vivo NEX 3','vivo NEX 3 5G','Motorola Moto G Stylus (2021)','Lenovo K12 Pro','Microsoft Surface Duo','Infinix Hot 10 Play','HTC U20 5G'}
for x in D:
 m=re.search(r'(\d+(?:\.\d+)?) (?:inches|inch)',x['specs'].get('display',''))
 if not m:continue
 inches=float(m[1])
 if x['category']=='tablet' and inches<6.5:small_tablet_flags.append(x['id'])
 if x['category']=='phone' and inches>=6.8:
  large_phone_review.append({'id':x['id'],'name':x['name'],'display_inches':inches,'reviewed_as':'dual-screen mobile phone' if 'Surface Duo' in x['name'] else 'large-screen smartphone','source_url':x['source_url']})
  check('Large phone manual review '+x['id'],x['name'] in reviewed_large_phones)
check('No tablet with smartphone-sized screen under 6.5 inches',not small_tablet_flags,str(small_tablet_flags))
semantic={'executed_at':'2026-11-02','result':'PASS','category_counts':dict(collections.Counter(x['category'] for x in D)),'small_tablet_flags':small_tablet_flags,'large_phone_manual_reviews':large_phone_review,'known_regression':'Substring pad in Coolpad must not classify as tablet; fixed in final builder.','epa_semantics':'laptop/desktop/tablet follow original type field; TVs follow original television registry.','date_semantics':'Every year has an explicit year_basis; no missing years or invented exact day.'}
(O/'SEMANTIC_AUDIT.json').write_text(json.dumps(semantic,ensure_ascii=False,indent=2))

# CSV parity and immutable manifest capture.
with (O/'devices.csv').open(newline='',encoding='utf-8-sig') as f:c=list(csv.DictReader(f))
check('CSV/JSON identity parity',len(c)==1000 and {r['id'] for r in c}=={x['id'] for x in D})
report={'executed_at':'2026-11-02','result':'PASS','assertions':len(checks),'records':len(D),'category_counts':dict(collections.Counter(x['category'] for x in D)),'source_coverage_records':sum(bool(x['source_url']) for x in D),'registry_crosschecks':len(epa),'gsma_crosschecks':sum(x['source_name'].startswith('GSMArena') for x in D),'models_with_price':sum(bool(x['quote_ids']) for x in D),'quotes_total':len(Q),'quotes_matched':sum(bool(q.get('device_id')) for q in Q),'sha256':hashlib.sha256((O/'devices.json').read_bytes()).hexdigest(),'interpretation':'Checks verify structure, provenance links, retained source consistency and price lineage. They do not measure real-world resale-price prediction error or guarantee source data is error-free.','checks':checks}
(O/'DATA_VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False,indent=2))
