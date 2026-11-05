#!/usr/bin/env python3
"""Fetch public source snapshots for the ReTech factual catalog.
Usage: python acquire_all.py --raw-dir ./raw
Existing snapshots are reused. --refresh explicitly fetches again; source data
may then differ from the 2026-11-02 submission snapshot.
"""
from pathlib import Path
import argparse,json,urllib.request,concurrent.futures,time,hashlib
ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--raw-dir',type=Path,default=Path(__file__).resolve().parent)
ap.add_argument('--refresh',action='store_true');args=ap.parse_args();P=args.raw_dir.resolve();P.mkdir(parents=True,exist_ok=True)
SOURCES={
'computers-raw.json':'https://data.energystar.gov/resource/rxdj-2c88.json?$limit=10000',
'tv-raw.json':'https://data.energystar.gov/resource/pd96-rr3d.json?$limit=5000',
'gsm-raw.csv':'https://raw.githubusercontent.com/foykes/gsm-arena-dataset/main/gsm_arena_full_dataset.csv',
'apple-iphone-raw.html':'https://support.apple.com/en-us/108044',
'apple-ipad-raw.html':'https://support.apple.com/en-us/108043',
'apple-macbookair-raw.html':'https://support.apple.com/en-us/102869',
'apple-macbookpro-raw.html':'https://support.apple.com/en-us/108052',
'apple-macmini-raw.html':'https://support.apple.com/en-us/102852',
'apple-imac-raw.html':'https://support.apple.com/en-us/108054'
}
ROUTERS=[
('2015-01-07','https://www.tp-link.com/kr/press/news/15421/','tplink-15421-raw.html'),
('2016-01-06','https://www.tp-link.com/us/press/news/16335/','tplink-16335-raw.html'),
('2017-01-05','https://www.tp-link.com/us/press/news/17242/','tplink-17242-raw.html'),
('2018-12-10','https://www.tp-link.com/us/press/news/18170/','tplink-18170-raw.html'),
('2020-01-05','https://www.tp-link.com/us/press/news/18645/','tplink-18645-raw.html'),
('2020-01-07','https://www.tp-link.com/ph/press/news/18651/','tplink-18651-raw.html'),
('2021-01-11','https://www.tp-link.com/us/press/news/19358/','tplink-19358-raw.html'),
('2022-01-04','https://www.tp-link.com/baltic/press/news/19853/','tplink-19853-raw.html'),
('2022-10-31','https://www.tp-link.com/us/press/news/20270/','tplink-20270-raw.html'),
('2023-01-05','https://www.tp-link.com/uk/press/news/20388/','tplink-20388-raw.html'),
('2024-01-09','https://www.tp-link.com/us/press/news/20921/','tplink-20921-raw.html'),
('2025-01-06','https://www.tp-link.com/id/press/news/21550/','tplink-21550-raw.html')]
EXTRAS=[('2019-09-28','https://www.tp-link.com/pk/press/news/18639/','router-extra-18639-raw.html'),('2023-01-04','https://press.asus.com/news/press-releases/3332','router-extra-3332-raw.html')]
for date,url,name in ROUTERS+EXTRAS:SOURCES[name]=url

def get(kv):
 filename,url=kv;f=P/filename
 if f.exists() and not args.refresh:return {'file':filename,'url':url,'status':'cached','size':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'ReTechAcademicCatalog/1.0 educational source attribution'})
   with urllib.request.urlopen(req,timeout=45) as res:body=res.read()
   f.write_bytes(body)
   return {'file':filename,'url':url,'status':'downloaded','size':len(body),'sha256':hashlib.sha256(body).hexdigest()}
  except Exception as e:
   if attempt==2:return {'file':filename,'url':url,'status':'error','error':str(e)}
   time.sleep(1)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(get,SOURCES.items()))
(P/'router-launch-index.json').write_text(json.dumps([{'date':d,'url':u,'file':f} for d,u,f in ROUTERS],indent=2))
# The ASUS Canada page was verified through official webpage retrieval although
# its direct download returns HTTP500. Preserve the factual verification file
# shipped with the source snapshot; do not replace it with guessed content.
extra=[{'date':d,'url':u,'file':f} for d,u,f in EXTRAS]
extra.append({'date':'2020-07-28','url':'https://www.asus.com/ca-en/news/bmnmjuc4irhbodiw/','error':'Direct download unavailable; see retained asus-2020-verified-facts.json'})
(P/'router-extra-index.json').write_text(json.dumps(extra,indent=2))
(P/'acquisition_log.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'sources':len(results),'successful':sum(r['status']!='error' for r in results),'failed':[r for r in results if r['status']=='error']},indent=2))
if any(r['status']=='error' for r in results):raise SystemExit(1)
