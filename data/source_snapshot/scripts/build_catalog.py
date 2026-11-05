#!/usr/bin/env python3
"""Build a reproducible 1,000-model factual catalog from retained source snapshots.
No synthetic model, specification, year, price or rating is generated.
Run fetch_sources.py, fetch_apple.py, fetch_router_launches.py first if snapshots missing.
"""
from pathlib import Path
import re,html,json,csv,ast,hashlib,collections,datetime,argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--raw-dir',type=Path,default=Path(__file__).resolve().parent)
parser.add_argument('--output-dir',type=Path,default=None)
parser.add_argument('--prices',type=Path,default=None)
args=parser.parse_args()
P=args.raw_dir.resolve()
O=(args.output_dir or P).resolve();O.mkdir(parents=True,exist_ok=True)
CAPTURED='2026-11-02'
CUTOFF='2026-11-02'
OUT=[]
BRANDS={'apple':'Apple','samsung':'Samsung','xiaomi':'Xiaomi','google':'Google','sony':'Sony','huawei':'Huawei','honor':'HONOR','lg':'LG','motorola':'Motorola','nokia':'Nokia','oneplus':'OnePlus','oppo':'OPPO','vivo':'vivo','realme':'realme','asus':'ASUS','acer':'Acer','lenovo':'Lenovo','dell':'Dell','hp':'HP','microsoft':'Microsoft','msi':'MSI','amazon':'Amazon','philips':'Philips','hisense':'Hisense','tp-link':'TP-Link','panasonic':'Panasonic','blackview':'Blackview','alcatel':'Alcatel','zte':'ZTE','blackberry':'BlackBerry','htc':'HTC','infinix':'Infinix','tecno':'TECNO','meizu':'Meizu','allview':'Allview','plum':'Plum','jp. ik':'jp.ik','jp.ik':'jp.ik','loewe.':'Loewe','loewe':'Loewe','sansui.':'Sansui','sansui':'Sansui'}
def norm(s):return re.sub(r'[^a-z0-9]','',str(s).lower())
def clean(s):
 if not s:return ''
 if str(s).startswith(('b\"',"b'")):
  try:
   a=ast.literal_eval(s)
   if isinstance(a,bytes):return a.decode('utf-8','replace')
  except Exception:pass
 return str(s).strip()
def text(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s))).strip()
def add(cat,brand,name,model,year,specs,source_url,source_name,source_record_id,source_dataset_url,year_basis,release_date=None,image_url=None,source_as_of=None,priority=2,aliases=None):
 if not 2015<=int(year)<=2026:return
 if release_date and release_date>CUTOFF:return
 if '\ufffd' in (brand+name+model+json.dumps(specs,ensure_ascii=False)):return None # reject malformed source text; never guess a repaired product identity
 source_brand=brand
 brand=BRANDS.get(brand.lower(),brand)
 if cat=='tv':name=re.sub(r'^(?:(?:Smart|Google|Android)\s+)?(?:Tivi|TV)\s+','',name,flags=re.I)
 if not name.lower().startswith(brand.lower()):name=brand+' '+name
 key='|'.join([cat,brand,name,model]);rid='RT-'+hashlib.sha256(key.encode()).hexdigest()[:12].upper()
 rec={'id':rid,'category':cat,'brand':brand,'source_brand':source_brand,'name':name,'model':model,'release_year':int(year),'release_date':release_date,'year_basis':year_basis,'specs':{k:v for k,v in specs.items() if v not in ['',None,'N/A','None']},'image_url':image_url,'image_source_url':source_url if image_url else None,'source_url':source_url,'source_name':source_name,'source_record_id':str(source_record_id),'source_dataset_url':source_dataset_url,'retrieved_at':CAPTURED,'source_as_of':source_as_of,'price':None,'price_currency':None,'price_type':None,'quote_ids':[],'aliases':aliases or [],'_priority':priority}
 OUT.append(rec)
 return rec
# Apple model-identification articles: one record per named generation/configuration;
# model numbers are stored as aliases, not expanded into artificial rows.
APPLE={'iphone':('108044','phone'),'ipad':('108043','tablet'),'macbookair':('102869','laptop'),'macbookpro':('108052','laptop'),'macmini':('102852','desktop'),'imac':('108054','desktop')}
apple_aliases=set()
for slug,(aid,cat) in APPLE.items():
 f=P/('apple-'+slug+'-raw.html');s=f.read_text();parts=re.split(r'<h2[^>]*>(.*?)</h2>',s,flags=re.S)
 for i in range(1,len(parts),2):
  title=text(parts[i]);seg=parts[i+1] if i+1<len(parts) else '';txt=text(seg)
  m=re.search(r'Year(?: introduced)?:\s*(20\d{2})',txt) or re.search(r'\b(20\d{2})\b',title)
  if not m or int(m[1])<2015 or int(m[1])>2026:continue
  codes=sorted(set(re.findall(r'\bA\d{4}\b',txt)))
  ident=re.search(r'Model Identifier:\s*(.*?)(?:Part Numbers?:|Newest compatible|Tech Specs|$)',txt)
  model=ident[1].strip() if ident else (', '.join(codes) or title)
  aliases=codes + ([x.strip() for x in model.split(', ')] if ident else [])
  apple_aliases.update(aliases)
  chip=re.search(r'This model has the ([^.]+?) chip',txt)
  name=title
  if chip and chip[1] not in name:name+=' — '+chip[1]
  if slug=='imac' and title=='iMac (24-inch, M1, 2021)':name+=' — '+model
  image=re.search(r'<img[^>]+src="([^"]+)"',seg)
  if not image:image=re.search(r'<img[^>]+src=\'([^\']+)\'',seg)
  specs={}
  for label,key,endlabels in [('Capacity','storage','Colors|Model|Details'),('Colors','colors','Model|Details'),('Ports','ports','Colors|Model')]:
   ma=re.search(label+r':\s*(.*?)(?=(?:'+endlabels+r')\s*(?:number|numbers|Identifier)?\s*:|$)',txt)
   if ma:
    value=ma[1].strip()
    if key=='storage':value=re.split(r'\s+(?:Model|Details|Colors)\b',value,maxsplit=1,flags=re.I)[0].strip()
    specs[key]=value[:250].strip()
  if chip:specs['chip']=chip[1]
  if codes:specs['model_numbers']=', '.join(codes)
  if ident:specs['model_identifier']=model
  part_numbers=re.search(r'Part Numbers?:\s*(.*?)(?=Newest compatible|Tech Specs|User Guide|Quick Start Guide|$)',txt)
  if part_numbers:specs['part_numbers']=part_numbers[1].strip()
  links=re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',seg,re.S)
  tech=next((html.unescape(u) for u,l in links if 'tech specs' in text(l).lower()),None)
  if tech and tech.startswith('/'):tech='https://support.apple.com'+tech
  article='https://support.apple.com/en-us/'+aid
  add(cat,'Apple',name,model,int(m[1]),specs,tech or article,'Apple Support',slug+':'+title+':'+model,article,'manufacturer_model_year',image_url=html.unescape(image[1]) if image else None,priority=0,aliases=aliases+[title])
# Historical GSMArena mirror captured in 2021, treated as dated specifications,
# never as current market prices or inventory.
GSM='https://github.com/foykes/gsm-arena-dataset/blob/main/gsm_arena_full_dataset.csv'
with (P/'gsm-raw.csv').open(newline='',encoding='utf-8-sig') as f:
 for idx,raw in enumerate(csv.DictReader(f),2):
  r={k:clean(v) for k,v in raw.items()};brand=r.get('Brand','');name=r.get('Model Name','');status=r.get('Status','');ann=r.get('Announced','')
  if not name or brand.lower()=='apple' or any(w in status.lower() for w in ['cancelled','rumored','rumoured','coming soon']):continue
  ym=re.search(r'Released\s+(20\d{2})',status) or re.search(r'\b(20\d{2})\b',ann)
  if not ym or not 2015<=int(ym[1])<=2026:continue
  tablet_pattern=r'\b(tab|tablet|pad|slate)\b|\btab\d|(?:mediapad|matepad|zenpad|fonepad|mipad|ideapad)\b|\bpixel c\b|\bgalaxy view(?:2)?\b|\b(?:optimax|aquaris m10|lenovo m10|predator 8|iconia|amazon fire|allview viva|kolorpad|grand x view|qtab|dell venue|nvidia shield|honor v6)\b|\balcatel (?:[13]t|pixi [34] \([7-9]|pixi 3 \(10|pop 10)\b'
  screen_match=re.search(r'(\d+(?:\.\d+)?) inches',r.get('Size',''))
  if re.search(tablet_pattern,name,re.I):cat='tablet'
  elif screen_match and float(screen_match[1])>=7.8 and not re.search(r'\b(?:mate x|mate xs|surface duo|flexpai|fold)\b',name,re.I):continue # unresolved large-format device excluded rather than mislabeled as a phone
  else:cat='phone'
  if cat=='phone' and brand.lower() not in {'samsung','xiaomi','google','sony','huawei','honor','lg','motorola','nokia','oneplus','oppo','vivo','realme','asus','acer','lenovo','microsoft','zte','alcatel','blackberry','meizu','infinix','tecno','htc'}:continue # prioritize identifiable consumer phone families; unresolved obscure formats are not used as filler
  specs={v:r.get(k,'') for k,v in [('Chipset','chipset'),('CPU','cpu'),('Internal','memory'),('Size','display'),('Resolution','resolution'),('OS','os'),('Type_1','battery'),('Charging','charging'),('Technology','network'),('WLAN','wifi'),('Weight','weight'),('Status','release_status'),('Announced','announced')]}
  specs['source_snapshot']='2021-02-01'
  if r.get('Price'):specs['historical_price_text']=r['Price']
  add(cat,brand,name,r.get('Models') or name,int(ym[1]),specs,GSM+'#L'+str(idx),'GSMArena via foykes/gsm-arena-dataset',idx,GSM,'source_released_year' if 'Released' in status else 'source_announced_year',image_url=r.get('Model Image') or None,source_as_of='2021-02-01',priority=3)
# EPA ENERGY STAR: year means first date available in listed markets, not
# certification date. Models after the project cutoff are excluded.
EPA_COMP='https://data.energystar.gov/resource/rxdj-2c88.json?$limit=10000'
for r in json.loads((P/'computers-raw.json').read_text()):
 typ=r.get('type','');cat='tablet' if 'Tablet' in typ else 'laptop' if ('Notebook' in typ or typ=='Mobile Workstation') else 'desktop' if typ in ['Desktop','Integrated Desktop','Workstation'] else None
 if not cat:continue
 date=r.get('date_available_on_market','')[:10]
 if len(date)!=10 or date>CUTOFF or date<'2015-01-01':continue
 brand=r.get('brand_name','');model=r.get('model_number','');nm=r.get('model_name') or model
 if '*' in model or '*' in nm:continue # certification wildcard families are not exact individual models
 if brand.lower()=='apple' and (model in apple_aliases or nm in apple_aliases):continue
 name=nm if norm(model)==norm(nm) else nm+' ('+model+')'
 specs={}
 mapping={'type':'form_factor','processor_brand':'cpu_brand','physical_cpu_cores_count':'cpu_cores','cpu_base_clock_speed_ghz':'cpu_base_ghz','cpu_maximum_clock_speed_ghz':'cpu_max_ghz','system_memory_ram_gb':'ram_gb','operating_system_name':'os','storage_technology':'storage_type','number_of_installed_storage_drives':'storage_drives','total_battery_capacity_watt_hours':'battery_wh','touch_screen':'touch_screen','markets':'markets','tec_of_model_kwh':'annual_energy_kwh','energy_star_model_identifier':'certification_identifier'}
 for k,v in mapping.items():
  if r.get(k):specs[v]=r[k]
 specs['model_number']=model
 url='https://www.energystar.gov/productfinder/product/certified-computers/details/'+r['pd_id']
 add(cat,brand,name,model,int(date[:4]),specs,url,'US EPA ENERGY STAR',r['pd_id'],EPA_COMP,'market_availability_date',release_date=date,priority=2,aliases=[nm,model])
EPA_TV='https://data.energystar.gov/resource/pd96-rr3d.json?$limit=5000'
for r in json.loads((P/'tv-raw.json').read_text()):
 date=r.get('date_available_on_market','')[:10]
 if len(date)!=10 or date>CUTOFF or date<'2015-01-01':continue
 model=r.get('model_number','')
 if '*' in model:continue
 specs={}
 for k,v in {'diagonal_viewable_screen_size_inches':'screen_inches','native_horizontal_resolution_pixels':'horizontal_pixels','native_vertical_resolution_pixels':'vertical_pixels','resolution_format':'resolution','display_type':'display_type','backlight_technology_type':'backlight','physical_data_ports_available':'ports','features':'features','reported_annual_energy_consumption_kwh':'annual_energy_kwh','markets':'markets','application':'application'}.items():
  if r.get(k):specs[v]=r[k]
 add('tv',r['brand_name'],r.get('model_name') or model,model,int(date[:4]),specs,'https://www.energystar.gov/productfinder/product/certified-televisions/details/'+r['pd_id'],'US EPA ENERGY STAR',r['pd_id'],EPA_TV,'market_availability_date',release_date=date,priority=2,aliases=[model])
# Forty actual router/mesh models cited in dated original launch announcements.
# Commercial availability differs by region. Year is explicitly announcement year.
allowed={
'15421':['Archer C9','Archer C2600','Archer C3200'],
'16335':['Archer C3150','Archer C5400'],
'17242':['Deco M5'],
'18170':['Archer AX11000','Archer AX6000'],
'18645':['Deco X20','Deco X60','Deco X90'],
'18651':['Archer AX20'],
'19358':['Deco Voice X20','Deco X80-5G'],
'19853':['Archer AXE300','Archer AXE75','Deco XE200','Deco XE75'],
'20270':['Deco PX50','Deco X50-PoE','Deco X50-Outdoor'],
'20388':['Archer BE230','Archer BE550','Archer BE800','Archer BE805','Archer BE900','Archer GE800','Deco BE65','Deco BE65-5G','Deco BE85','Deco BE95'],
'20921':['Archer GE650'],
'21550':['Deco BE25-Outdoor','Deco BE65-Outdoor','Deco BE68'],
'18639':['Archer AX10'],
'3332':['ROG Rapture GT-BE98','RT-BE96U'],
'bmnmjuc4irhbodiw':['RT-AX86U','RT-AX82U']}
routerindex=json.loads((P/'router-launch-index.json').read_text())+json.loads((P/'router-extra-index.json').read_text())
for r in routerindex:
 key=r['url'].rstrip('/').split('/')[-1]
 if key not in allowed:continue
 fn=P/r.get('file',('router-extra-'+key+'-raw.html'))
 if not fn.exists() and key!='bmnmjuc4irhbodiw':continue
 txt=text(fn.read_text()) if fn.exists() else ' '.join(x['model'] for x in json.loads((P/'asus-2020-verified-facts.json').read_text())['models'])
 for name in allowed[key]:
  if name not in txt:raise ValueError('Source does not contain '+name)
  brand='ASUS' if 'asus.com' in r['url'] else 'TP-Link'
  add('router',brand,name,name,int(r['date'][:4]),{'device_type':'mesh_router' if 'Deco' in name else 'router','announcement_date':r['date']},r['url'],brand+' official announcement',key+':'+name,r['url'],'manufacturer_announcement_year',priority=0,aliases=[name])
# Retailer records with an explicit model year in their title are original,
# factual product observations. Apple aliases are joined below rather than
# duplicated as storage/color variants.
pricespath=args.prices or P/'prices_enriched.json'
if not pricespath.exists():pricespath=P.parent/'prices-work'/'prices_enriched.json'
if not pricespath.exists():pricespath=P.parent/'prices-work'/'prices_compact.json'
prices=json.loads(pricespath.read_text()) if pricespath.exists() else []

def family_key(name,cat):
 n=name.lower().replace('apple ','').replace('laptop ','')
 n=re.sub(r'\b\d+(?:gb|tb)\b','',n)
 n=re.sub(r'\b(?:wifi|wi-fi|5g|4g|cellular|chip|inch|inches)\b','',n)
 n=n.replace('mini 7 2024','mini a17 pro').replace('a16 2025','a16')
 n=re.sub(r'20\d{2}','',n)
 if cat=='phone':n=re.sub(r'\b\d+gb\b','',n)
 return norm(n)
def find_apple(q):
 title=q['model_name'].lower()
 if 'iphone' in title:
  c=sorted([x for x in OUT if x['brand']=='Apple' and x['category']=='phone'],key=lambda x:-len(x['name']))
  # longest full model label first prevents Pro from matching Pro Max.
  for x in c:
   a=x['name'].replace('Apple ','')
   if re.search(r'(?<!\w)'+re.escape(a)+r'(?!\w)',q['model_name'],re.I):return x
 elif 'ipad' in title:
  if 'mini 7' in title: needle='iPad mini (A17 Pro)'
  elif 'ipad a16' in title:needle='iPad (A16)'
  else:
   chip=re.search(r'\bM[1-9]\b',q['model_name']);size=re.search(r'\b(11|13)\s*inch',q['model_name'])
   if not chip or not size:return None
   family='Pro' if re.search(r'ipad pro',title) else 'Air' if re.search(r'ipad air',title) else ''
   needle=f'iPad {family} {size[1]}-inch ({chip[0]})'
  return next((x for x in OUT if x['brand']=='Apple' and x['category']=='tablet' and norm(needle)==norm(x['name'].replace('Apple ',''))),None)
 return None
for q in prices:
 match=find_apple(q)
 if match:
  match['quote_ids'].append(q['id'])
  if not match.get('image_url'):match['image_url']=q.get('image_url')
  continue
 yr=q.get('release_year')
 if not yr or not 2015<=yr<=2026:continue
 nm=q['model_name'];cat=q['category'];brand=q['brand']
 # one factual model per explicit TV model code or retailer title, not per condition
 m=re.search(r'\(([^)]+)\)\s*$',nm);model=m[1] if m else nm
 existing=next((x for x in OUT if x['category']==cat and norm(model)==norm(x['model'])),None)
 if existing:existing['quote_ids'].append(q['id']);continue
 specs={}
 if q.get('storage_text'):specs['memory']=q['storage_text']
 if q.get('release_year_basis'):specs['source_year_evidence']=q['release_year_basis']
 labelmap={'Chipset':'chipset','Loại CPU':'cpu','Dung lượng RAM':'ram','Bộ nhớ trong':'storage','Kích thước màn hình':'display','Độ phân giải màn hình':'resolution','Hệ điều hành khi ra mắt':'os','Pin':'battery','Wi-Fi':'wifi','Trọng lượng':'weight'}
 for label,value in q.get('specifications',{}).items():specs[labelmap.get(label,label)]=value
 basis='retailer_specification_release_year' if q.get('specifications') and any('ra mắt' in k.lower() for k in q['specifications']) else 'retailer_explicit_model_year'
 rec=add(cat,brand,nm,model,yr,specs,q['source_url'],q['source_name'],q['id'],q['listing_source_url'],basis,image_url=q.get('image_url'),priority=1)
 if rec:rec['quote_ids']=[q['id']]
# Exact joins for manufacturer model names (routers) or precise model-number
# aliases present in a retailer title. Fuzzy similarity never attaches a price.
for q in prices:
 if any(q['id'] in x['quote_ids'] for x in OUT):continue
 candidates=[]
 for x in OUT:
  if x['category']!=q['category']:continue
  for alias in [x['model']]+x['aliases']:
   if len(norm(alias))<6:continue
   if re.search(r'(?<![A-Za-z0-9])'+re.escape(alias)+r'(?![A-Za-z0-9])',q['model_name'],re.I):
    candidates.append(x);break
 if len(candidates)==1:
  candidates[0]['quote_ids'].append(q['id'])
  if not candidates[0]['image_url']:candidates[0]['image_url']=q.get('image_url')
# Deduplicate exact canonical identities and select across years and brands.
unique={}
for x in OUT:
 key=(x['category'],norm(x['brand']),norm(x['name']),norm(x['model']))
 if key in unique:
  u=unique[key];u['quote_ids']=list(dict.fromkeys(u['quote_ids']+x['quote_ids']))
 else:unique[key]=x
OUT=list(unique.values())
BRAND_ORDER=['Apple','Samsung','Google','Xiaomi','OnePlus','Sony','Huawei','HONOR','OPPO','vivo','realme','Nokia','Motorola','LG','Lenovo','Dell','HP','ASUS','Acer','Microsoft','MSI','Amazon','Hisense','Philips','TP-Link']
def rank(x):
 try:b=BRAND_ORDER.index(x['brand'])
 except ValueError:b=99
 return (x['_priority'],not bool(x['quote_ids']),b,-x['release_year'],x['name'],x['model'])
def choose(cat,n):
 pool=sorted([x for x in OUT if x['category']==cat],key=rank)
 selected=[x for x in pool if x['_priority']<=1 or x['quote_ids']]
 selected=selected[:n]
 rest=[x for x in pool if x not in selected]
 # round-robin year then brand maintains older authentic models and diversity.
 groups=collections.defaultdict(list)
 for x in rest:groups[(x['release_year'],x['brand'])].append(x)
 keys=sorted(groups,key=lambda k:(-k[0],BRAND_ORDER.index(k[1]) if k[1] in BRAND_ORDER else 99,k[1]))
 while len(selected)<n and any(groups.values()):
  for key in keys:
   if groups[key]:selected.append(groups[key].pop(0))
   if len(selected)>=n:break
 if len(selected)!=n:raise ValueError(f'Not enough {cat}: {len(selected)} / {n}')
 return selected
TARGET={'phone':410,'laptop':200,'desktop':130,'tablet':100,'router':40,'tv':120}
selected=[]
for cat,n in TARGET.items():selected+=choose(cat,n)
selected=sorted(selected,key=lambda x:(['phone','laptop','tablet','desktop','router','tv'].index(x['category']),rank(x)))
for x in selected:x.pop('_priority',None)
assert len(selected)==1000
assert len({x['id'] for x in selected})==1000
assert all(2015<=x['release_year']<=2026 for x in selected)
# Quote ids retain variant-specific conditions and storage in separate price records.
by_quote={qid:x for x in selected for qid in x['quote_ids']}
for q in prices:
 match=by_quote.get(q['id']);q['device_id']=match['id'] if match else None
 q['match_basis']='exact_manufacturer_family_or_model_number' if match else None
for x in selected:
 qs=[q for q in prices if q['id'] in x['quote_ids']]
 new=[q for q in qs if q.get('condition')=='new']
 preferred=(new or qs)
 if preferred:
  q=min(preferred,key=lambda q:q['price']);
  if q.get('image_url'):x['image_url']=q['image_url'];x['image_source_url']=q['source_url']
  x['price']=q['price'];x['price_currency']=q['currency'];x['price_type']=q['price_type'];x['price_source_url']=q['source_url'];x['price_observed_at']=q['observed_at'];x['price_condition']=q['condition'];x['price_variant']=q.get('storage_text')
(O/'devices.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2))
(O/'prices_joined.json').write_text(json.dumps(prices,ensure_ascii=False,indent=2))
fields=['id','category','brand','source_brand','name','model','release_year','release_date','year_basis','price','price_currency','price_type','price_condition','price_variant','price_observed_at','price_source_url','image_url','source_name','source_url','source_record_id','source_dataset_url','retrieved_at','source_as_of','specs_json','quote_ids']
with (O/'devices.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader()
 for x in selected:w.writerow({**x,'specs_json':json.dumps(x['specs'],ensure_ascii=False),'quote_ids':'|'.join(x['quote_ids'])})
stats={'total':len(selected),'category_counts':dict(collections.Counter(x['category'] for x in selected)),'year_min':min(x['release_year'] for x in selected),'year_max':max(x['release_year'] for x in selected),'year_counts':dict(sorted(collections.Counter(x['release_year'] for x in selected).items())),'source_counts':dict(collections.Counter(x['source_name'] for x in selected)),'year_basis_counts':dict(collections.Counter(x['year_basis'] for x in selected)),'models_with_source_image':sum(bool(x['image_url']) for x in selected),'models_with_price_observations':sum(bool(x['quote_ids']) for x in selected),'price_observations_matched':sum(bool(q['device_id']) for q in prices),'price_observations_total':len(prices),'missing_release_year':sum(x['release_year'] is None for x in selected),'distinct_ids':len({x['id'] for x in selected}),'retrieved_at':CAPTURED,'dataset_sha256':hashlib.sha256((O/'devices.json').read_bytes()).hexdigest()}
(O/'dataset_stats.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
print(json.dumps(stats,ensure_ascii=False,indent=2))
