#!/usr/bin/env python3
"""Read product JSON-LD and statically decode primitive Nuxt parameters.

This script never executes JavaScript downloaded from a website.
"""
import concurrent.futures,datetime,gzip,hashlib,html,json,re,time,urllib.request
from pathlib import Path
HERE=Path(__file__).resolve().parent

def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',str(s)))).strip()
def split_js_args(s):
 out=[];start=0;quote=None;escape=False;depth=0
 for i,c in enumerate(s):
  if quote:
   if escape:escape=False
   elif c=='\\':escape=True
   elif c==quote:quote=None
   continue
  if c in ['"',"'"]:quote=c
  elif c in '[{(':depth+=1
  elif c in ']})':depth-=1
  elif c==',' and depth==0:out.append(s[start:i].strip());start=i+1
 out.append(s[start:].strip());return out

def primitive(raw):
 try:return json.loads(raw)
 except (ValueError,TypeError):return None

def nuxt(s):
 m=re.search(r'window\.__NUXT__=(.*?)</script>',s,re.S)
 if not m:return {},''
 js=m[1];p=re.match(r'\(function\(([^)]*)\)',js)
 if not p:return {},js
 boundary=js.rfind('}(')
 if boundary<0:return {},js
 args=js[boundary+2:]
 if args.endswith('));'):args=args[:-3]
 elif args.endswith('))'):args=args[:-2]
 vals=split_js_args(args);params=p[1].split(',')
 return {k:primitive(v) for k,v in zip(params,vals)},js

def enrich(r):
 out={'id':r['id'],'source_url':r['source_url'],'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}
 try:
  req=urllib.request.Request(r['source_url'],headers={'User-Agent':'Mozilla/5.0 (compatible; EducationalDataCollection/1.0)'})
  cache_dir=HERE.parent/'price-cache';cache_dir.mkdir(exist_ok=True);cache=cache_dir/(r['id']+'.html.gz')
  if cache.exists():b=gzip.open(cache,'rb').read()
  else:
   b=urllib.request.urlopen(req,timeout=35).read()
   with gzip.open(cache,'wb') as f:f.write(b)
  s=b.decode('utf-8');out['http_status']=200;out['sha256']=hashlib.sha256(b).hexdigest()
  products=[]
  for raw in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',s,re.S):
   try:j=json.loads(raw)
   except ValueError:continue
   if isinstance(j,dict) and j.get('@type')=='Product':products.append(j)
  if products:
   p=products[0];out['source_product_name']=p.get('name');out['source_sku']=p.get('sku');out['specifications']={clean(v.get('name','')):clean(v.get('value','')) for v in p.get('additionalProperty',[]) if v.get('name')}
   out['observed_product_offer']=p.get('offers',{})
  mapping,js=nuxt(s)
  # Earlier hydration objects can describe recommendations or comparisons.
  # The selected product's final specification object is adjacent to childProductId.
  anchor=js.rfind('specification:')
  if anchor>=0:
   start=js.find('{',anchor);depth=0;quote=None;escape=False;end=start
   for i in range(start,len(js)):
    c=js[i]
    if quote:
     if escape:escape=False
     elif c=='\\':escape=True
     elif c==quote:quote=None
     continue
    if c in ['"',"'"]:quote=c
    elif c=='{':depth+=1
    elif c=='}':
     depth-=1
     if depth==0:end=i+1;break
   js=js[start:end]
   out['specification_scope']='selected product final hydration specification object'
  else:js=''
  patterns=[r'label:"(Thời điểm ra mắt|Năm ra mắt|Năm sản xuất|Năm giới thiệu)",[^{}]{0,300}?value:([^,}\]]+)',r'label:"(Thời điểm ra mắt|Năm ra mắt|Năm sản xuất|Năm giới thiệu)",value:([^,}\]]+)']
  hits=[]
  token=r'(?:"(?:\\.|[^"\\])*"|[A-Za-z_$][A-Za-z0-9_$]*|[0-9]+)'
  field_pattern=r'key:('+token+r'),label:('+token+r'),(?:label_url:('+token+r'),)?value:('+token+r')'
  for m in re.finditer(field_pattern,js):
   label=mapping.get(m[2],primitive(m[2]));value=mapping.get(m[4],primitive(m[4]))
   if not isinstance(label,str) or not isinstance(value,(str,int,float)):continue
   label=clean(label);value=clean(value)
   if label not in out.setdefault('specifications',{}):out['specifications'][label]=value
   if label in ['Thời điểm ra mắt','Năm ra mắt','Năm sản xuất','Năm giới thiệu']:
    years=re.findall(r'\b(20(?:1[5-9]|2[0-6]))\b',value)
    if years:hits.append({'label':label,'value':value,'year':int(years[0]),'excerpt':m[0]})
  for pattern in patterns:
   for m in re.finditer(pattern,js):
    raw=m[2].strip();value=mapping.get(raw,primitive(raw));value=clean(value) if value is not None else None
    if not value:continue
    years=re.findall(r'\b(20(?:1[5-9]|2[0-6]))\b',value)
    if years:hits.append({'label':m[1],'value':value,'year':int(years[0]),'excerpt':m[0]})
  unique={json.dumps(h,ensure_ascii=False):h for h in hits}
  out['release_year_evidence']=list(unique.values())
  if hits:out['release_year']=hits[0]['year'];out['release_year_label']=hits[0]['label'];out['release_year_literal']=hits[0]['value']
 except Exception as e:out['error']=str(e)
 return out

def main():
 rows=json.loads((HERE/'prices_compact.json').read_text());candidates=[];caps={'phone':36,'router':20,'laptop':30,'desktop':18}
 for category,limit in caps.items():candidates.extend([r for r in rows if r['category']==category and not r['release_year']][:limit])
 found=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  for i,x in enumerate(pool.map(enrich,candidates)):
   found.append(x)
   if i%10==0:print(i+1,len(candidates),x.get('source_product_name'),x.get('release_year'),x.get('error'),flush=True)
 metadata={r['id']:r for r in found}
 (HERE/'product_metadata.json').write_text(json.dumps(found,ensure_ascii=False,indent=2),encoding='utf-8')
 for r in rows:
  m=metadata.get(r['id'])
  if not m:continue
  if m.get('release_year'):
   r['release_year']=m['release_year'];r['release_year_source']=r['source_url'];r['release_year_basis']=m['release_year_label']+': '+m['release_year_literal']
  if m.get('specifications'):r['specifications']=m['specifications']
  if m.get('source_sku'):r['source_sku']=m['source_sku']
 (HERE/'prices_enriched.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'fetched':len(found),'year_from_product_specs':sum(bool(m.get('release_year')) for m in found),'total_year_known':sum(bool(r['release_year']) for r in rows),'errors':sum('error' in m for m in found),'routers_year_known':sum(bool(r['release_year']) for r in rows if r['category']=='router')},ensure_ascii=False),flush=True)
if __name__=='__main__':main()
