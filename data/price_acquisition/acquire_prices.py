#!/usr/bin/env python3
"""Collect real advertised VND prices from CellphoneS public category pages.

No price is generated. Each record is backed by a saved gzipped HTML snapshot
and its exact product-card excerpt. These are asking prices, not completed sales.
Run: python acquire_prices.py [--refresh]
"""
import argparse, csv, datetime, gzip, hashlib, html, json, re, urllib.request
from pathlib import Path

HERE=Path(__file__).resolve().parent
SOURCES=[
 ('phone-new','https://cellphones.com.vn/mobile.html','cellphones.com.vn1.html','phone',20),
 ('phone-used','https://cellphones.com.vn/hang-cu/dien-thoai.html','used-dien-thoai.html.html','phone',16),
 ('laptop-new','https://cellphones.com.vn/laptop.html','cellphones.com.vn3.html','laptop',20),
 ('laptop-used','https://cellphones.com.vn/hang-cu/laptop.html','used-laptop.html.html','laptop',10),
 ('tablet-new','https://cellphones.com.vn/tablet.html','tablet.html.html','tablet',16),
 ('tablet-used','https://cellphones.com.vn/hang-cu/ipad.html','used-ipad.html.html','tablet',12),
 ('tv-new','https://cellphones.com.vn/tivi.html','tivi.html.html','tv',18),
 ('desktop-new','https://cellphones.com.vn/may-tinh-de-ban.html','may-tinh-de-ban.html.html','desktop',18),
 ('router-new','https://cellphones.com.vn/phu-kien/thiet-bi-mang/thiet-bi-phat-song-wifi/router-wifi.html','router.html','router',20),
]

def text(s):return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s))).strip()
def find(pat,s):
 m=re.search(pat,s,re.S|re.I);return html.unescape(m[1]).strip() if m else None

def get_brand(name,cat):
 if cat=='desktop' and name.upper().startswith('PC CPS'):return 'CPS'
 if re.search(r'\b(iPhone|iPad|MacBook|iMac|Mac mini|Mac Studio)\b',name,re.I):return 'Apple'
 for b in ['Samsung','Xiaomi','HONOR','OPPO','vivo','realme','Nothing','Lenovo','ASUS','Acer','MSI','HP','Dell','Gigabyte','Huawei','LG','Sony','Aqua','TCL','Coocaa','TP-Link','Mercusys','Tenda','Totolink']:
  if re.search(re.escape(b),name,re.I):return b
 return None

def condition(name,src):
 n=name.lower()
 if re.search(r'cũ\s*đẹp',n):return 'used_good'
 if re.search(r'cũ\s*(trầy|xước)',n):return 'used_scratched'
 if re.search(r'(đã\s*)?kích\s*hoạt',n):return 'activated'
 if 'trưng bày' in n:return 'display'
 if 'đổi bảo hành' in n:return 'warranty_replacement'
 return 'used_other' if '/hang-cu/' in src else 'new'

def model_name(n):
 n=re.sub(r'\s*[|]\s*Chính hãng.*$','',n,flags=re.I)
 n=re.sub(r'\s*-\s*(?:Cũ|Đã Kích Hoạt|Chính hãng Đã kích hoạt|Đổi bảo hành).*$', '',n,flags=re.I)
 n=re.sub(r'\s*[|]\s*Hàng trưng bày.*$', '',n,flags=re.I)
 return n.strip()

def run(refresh=False):
 records=[];manifest=[];seen=set();snapdir=HERE/'source_snapshots';snapdir.mkdir(exist_ok=True)
 observed=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')
 for key,url,cache_name,category,limit in SOURCES:
  cache=HERE/cache_name
  if refresh or not cache.exists():
   req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; EducationalDataCollection/1.0)'})
   data=urllib.request.urlopen(req,timeout=45).read();cache.write_bytes(data)
  else:data=cache.read_bytes()
  digest=hashlib.sha256(data).hexdigest();snapshot='source_snapshots/'+key+'.html.gz'
  with gzip.open(HERE/snapshot,'wb') as f:f.write(data)
  s=data.decode('utf-8');count=0
  cards=re.findall(r'<a\b[^>]*class="[^"]*product__link[^\"]*"[^>]*>.*?</a>',s,re.S)
  for card in cards:
   name=find(r'<h3[^>]*>(.*?)</h3>',card);product_url=find(r'\bhref="([^"]+)"',card)
   literal=find(r'class="product__price--show"[^>]*>(.*?)</p>',card)
   if not (name and product_url and literal):continue
   name=text(name);price_str=text(literal)
   digits=re.sub(r'[^0-9]','',price_str)
   if not digits or product_url in seen:continue
   price=int(digits)
   if price<100000:continue
   if category=='tv' and not re.search(r'\btivi\b',name,re.I):continue
   if category=='router' and not re.search(r'\brouter\b',name,re.I):continue
   if category=='laptop' and not re.search(r'\b(laptop|MacBook)\b',name,re.I):continue
   if category=='desktop' and not re.search(r'\b(PC|iMac|Mac Mini|Mac Studio)\b',name,re.I):continue
   image=find(r'<img[^>]*\bsrc="([^"]+)"',card)
   mn=model_name(name);year=find(r'\b(20(?:1[5-9]|2[0-6]))\b',mn)
   storage_matches=re.findall(r'\b\d+\s*(?:GB|TB)\b',mn,re.I)
   record={
    'id':'CPS-'+hashlib.sha256(product_url.encode()).hexdigest()[:12],
    'device_name':name,'model_name':mn,'brand':get_brand(name,category),'category':category,
    'price':price,'currency':'VND','price_type':'retailer_asking','condition':condition(name,url),
    'source_name':'CellphoneS','source_url':product_url,'listing_source_url':url,'observed_at':observed,
    'listed_date':None,'image_url':image,'storage_text':' / '.join(storage_matches) or None,
    'release_year':int(year) if year else None,
    'release_year_source':url if year else None,
    'release_year_basis':'year explicitly present in retailer product title' if year else None,
    'source_evidence':{'snapshot':snapshot,'sha256':digest,'price_literal':price_str,'extracted_html':card}
   }
   records.append(record);seen.add(product_url);count+=1
   if count>=limit:break
  manifest.append({'key':key,'url':url,'observed_at':observed,'http_status':200,'snapshot':snapshot,'sha256':digest,'record_count':count})
 (HERE/'prices.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
 fields=[k for k in records[0] if k!='source_evidence']
 with (HERE/'prices.csv').open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows({k:r[k] for k in fields} for r in records)
 slim=[{k:v for k,v in r.items() if k!='source_evidence'} for r in records]
 (HERE/'prices_compact.json').write_text(json.dumps(slim,ensure_ascii=False,indent=2),encoding='utf-8')
 stats={'count':len(records),'observed_at':observed,'by_category':{},'by_condition':{},'distinct_source_product_urls':len(seen),'currency':'VND','price_type':'retailer_asking','release_year_known':sum(r['release_year'] is not None for r in records),'sources':manifest,'limitations':['Advertised retailer asking prices, not completed transactions.','Displayed prices may change after the observation date and can depend on store, stock and purchase conditions.','Only years explicitly included in product titles are captured; no year inferred from CPU generation or model numbering.','One retailer source; condition labels follow the retailer and are not an independent physical inspection.','Raw HTML snapshots and exact card excerpts are included for reproducibility and audit.']}
 for r in records:
  stats['by_category'][r['category']]=stats['by_category'].get(r['category'],0)+1
  stats['by_condition'][r['condition']]=stats['by_condition'].get(r['condition'],0)+1
 (HERE/'price_sources_manifest.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({k:v for k,v in stats.items() if k!='sources'},ensure_ascii=False,indent=2))
 return records
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--refresh',action='store_true');args=ap.parse_args();run(args.refresh)
