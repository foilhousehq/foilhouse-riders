import {apiFetch,photoUrl} from '../../lib/api';
'use client';
import {clampView,gestureView,mapPoint,visibleTiles,MAX_ZOOM} from '../../lib/map-gestures.mjs';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {distanceKm,matchesSkiBrand} from '../../lib/rider-distance';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
export const styles=['Sit-down','Stand-up','Both'];
const color=(s:string)=>s==='Sit-down'?'#00b7ff':s==='Stand-up'?'#ff922b':s==='Both'?'#c084fc':s==='Mixed styles'?'#facc15':'#cbd5e1';
export function LocationPicker({profile,onChange}:{profile:any,onChange:(p:any)=>void}){
 const [countries,setCountries]=useState<string[]>([]),[country,setCountry]=useState(''),[cities,setCities]=useState<any[]>([]),[q,setQ]=useState(''),[error,setError]=useState('');
 useEffect(()=>{apiFetch('/foilhouse-riders/map/countries.json').then(r=>r.json()).then(c=>setCountries(c as string[])).catch(()=>setError('City search unavailable. Please try again later.'))},[]);
 useEffect(()=>{let active=true;setCities([]);setError('');if(country)apiFetch('/foilhouse-riders/map/cities/'+country+'.json').then(r=>r.json()).then(c=>{if(active)setCities(c as any[])}).catch(()=>{if(active)setError('Could not load cities. Choose the country again to retry.')});return()=>{active=false}},[country]);
 const names=new Intl.DisplayNames(['en'],{type:'region'});
 const matches=q.trim().length>=2?cities.filter(c=>c[0].toLocaleLowerCase().includes(q.trim().toLocaleLowerCase())).slice(0,20):[];
 return <div className="map-location"><h3>Put your city on the foiler map</h3><p>Choose a country, then search your city. Pins use an approximate city center, never your home address or live GPS location.</p><div className="two"><label className="field">Country<select value={country} onChange={e=>{setCountry(e.target.value);setQ('')}}><option value="">Choose country</option>{countries.map(c=><option value={c} key={c}>{names.of(c)||c}</option>)}</select></label><label className="field">Find a city<input value={q} disabled={!cities.length} onChange={e=>setQ(e.target.value)} placeholder={country?'Type at least 2 letters…':'Choose a country first'}/></label></div>{error&&<p role="alert">{error}</p>}{matches.length>0&&<div className="city-results" aria-label="City search results">{matches.map((c,i)=><button type="button" key={i} onClick={()=>{onChange({...profile,map_city:`${c[0]}${c[1]?', '+c[1]:''}, ${names.of(country)||country}`,map_lat:c[2],map_lng:c[3],map_visible:1});setQ('')}}>{c[0]} · {c[1]} · {names.of(country)}</button>)}</div>}{q.length>=2&&cities.length>0&&!matches.length&&<p>No matching city. Try a nearby larger city.</p>}{profile.map_city&&<p><b>Selected city:</b> {profile.map_city} <button type="button" className="textbtn" onClick={()=>onChange({...profile,map_city:'',map_lat:null,map_lng:null,map_visible:0})}>Clear map location</button></p>}<label className="consent"><input type="checkbox" disabled={!profile.map_city} checked={!!profile.map_visible} onChange={e=>onChange({...profile,map_visible:e.target.checked?1:0})}/>Show my approximate city and riding style on the public world map when my profile is published.</label></div>
}
export default function SkierMap({profiles,onSelect}:{profiles:any[],onSelect:(p:any)=>void}){
 const [basemap,setBasemap]=useState('Satellite'),[viewport,setViewport]=useState({width:720,height:360}),[filter,setFilter]=useState('All styles'),[brand,setBrand]=useState('All skis'),[near,setNear]=useState(''),[radius,setRadius]=useState(100),[query,setQuery]=useState(''),[zoom,setZoom]=useState(1),[center,setCenter]=useState([360,180]),[selected,setSelected]=useState<any>(null),[failed,setFailed]=useState(false);
 const mapRef=useRef<HTMLDivElement>(null),svgRef=useRef<SVGSVGElement>(null),popupRef=useRef<HTMLDivElement>(null),pinRef=useRef<SVGGElement|null>(null);
 const pointers=useRef(new Map<number,[number,number]>()),gesture=useRef<any>(null),suppressClick=useRef(false);
 const liveView=useRef({zoom,center});liveView.current={zoom,center};
 function beginGesture(){
  const svg=svgRef.current;if(!svg)return;
  const bounds=svg.getBoundingClientRect(),scale=bounds.width/720;
  const convert=([x,y]:[number,number])=>[(x-bounds.left-bounds.width/2)/scale,(y-bounds.top-bounds.height/2)/scale];
  gesture.current={...liveView.current,points:Array.from(pointers.current.values()).slice(0,2).map(convert),convert,moved:suppressClick.current};
 }
 function pointerDown(e:ReactPointerEvent<SVGSVGElement>){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(!pointers.current.size)suppressClick.current=false;
  pointers.current.set(e.pointerId,[e.clientX,e.clientY]);
  (e.target as Element).setPointerCapture(e.pointerId);
  if(pointers.current.size>1){suppressClick.current=true;setSelected(null)}
  beginGesture();
 }
 function pointerMove(e:ReactPointerEvent<SVGSVGElement>){
  if(!pointers.current.has(e.pointerId)||!gesture.current)return;
  pointers.current.set(e.pointerId,[e.clientX,e.clientY]);
  const start=gesture.current,points=Array.from(pointers.current.values()).slice(0,2).map(start.convert);
  if(!start.moved){const svg=svgRef.current!.getBoundingClientRect(),scale=svg.width/720;if(points.length<2&&Math.hypot(points[0][0]-start.points[0][0],points[0][1]-start.points[0][1])*scale<6)return;start.moved=true;setSelected(null)}
  suppressClick.current=true;
  const next=gestureView(start,points);liveView.current=next;setZoom(next.zoom);setCenter(next.center);
 }
 function pointerEnd(e:ReactPointerEvent<SVGSVGElement>){
  if(!pointers.current.delete(e.pointerId))return;
  if(e.type==='pointercancel')suppressClick.current=true;
  if(pointers.current.size)beginGesture();else gesture.current=null;
 }
 function changeZoom(factor:number){const next=clampView(zoom*factor,center);setZoom(next.zoom);setCenter(next.center)}
 const [popupPosition,setPopupPosition]=useState({left:12,top:12});
 function openPin(group:any[],pin:SVGGElement){pinRef.current=pin;setSelected(group)}
 function closePopup(){setSelected(null);pinRef.current?.focus({preventScroll:true})}
 useLayoutEffect(()=>{
  if(!selected)return;
  const map=mapRef.current,svg=svgRef.current,popup=popupRef.current;
  if(!map||!svg||!popup)return;
  const position=()=>{
   const matrix=svg.getScreenCTM();if(!matrix)return;
   const bounds=map.getBoundingClientRect(),card=popup.getBoundingClientRect();
   const pin=new DOMPoint(...mapPoint(selected[0].map_lat,selected[0].map_lng)).matrixTransform(matrix);
   const x=pin.x-bounds.left,y=pin.y-bounds.top;
   const left=Math.max(12,Math.min(bounds.width-card.width-12,x-card.width/2));
   const preferred=y-card.height-18>=12?y-card.height-18:y+18;
   const top=Math.max(12,Math.min(bounds.height-card.height-12,preferred));
   setPopupPosition({left,top});
  };
  position();const observer=new ResizeObserver(position);observer.observe(map);observer.observe(popup);
  return()=>observer.disconnect();
 },[selected,zoom,center,viewport]);
 useEffect(()=>{
  if(!selected)return;
  popupRef.current?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
  const outside=(event:PointerEvent)=>{if(!mapRef.current?.contains(event.target as Node))setSelected(null)};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();closePopup()}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[selected]);
 useEffect(()=>{
  const svg=svgRef.current;if(!svg)return;
  const resize=()=>{const b=svg.getBoundingClientRect();if(b.width&&b.height)setViewport({width:b.width,height:b.height})};
  resize();const observer=new ResizeObserver(resize);observer.observe(svg);
  const wheel=(e:WheelEvent)=>{e.preventDefault();setSelected(null);const b=svg.getBoundingClientRect(),scale=b.width/720;
   const offset=[(e.clientX-b.left-b.width/2)/scale,(e.clientY-b.top-b.height/2)/scale],view=liveView.current;
   const nextZoom=clampView(view.zoom*Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.005),view.center).zoom;
   const next=clampView(nextZoom,[view.center[0]+offset[0]/view.zoom-offset[0]/nextZoom,view.center[1]+offset[1]/view.zoom-offset[1]/nextZoom]);
   liveView.current=next;setZoom(next.zoom);setCenter(next.center);
  };
  svg.addEventListener('wheel',wheel,{passive:false});return()=>{observer.disconnect();svg.removeEventListener('wheel',wheel)};
 },[]);
 const tiles=visibleTiles(zoom,center,viewport.width,viewport.height),viewHeight=720*viewport.height/viewport.width;
 const arcgis='https://services.arcgisonline.com/ArcGIS/rest/services/';
 const all=profiles.filter(p=>p.map_visible&&Number.isFinite(p.map_lat)&&Number.isFinite(p.map_lng));
 const origins=Array.from(new Map(all.map(p=>[p.map_lat+','+p.map_lng,{value:p.map_lat+','+p.map_lng,label:p.map_city}])).values()).sort((a:any,b:any)=>a.label.localeCompare(b.label)) as any[];
const point=near?near.split(',').map(Number):null;const distance=(p:any)=>point?distanceKm(point[0],point[1],p.map_lat,p.map_lng):0;
const riders=all.filter(p=>(filter==='All styles'||p.riding_style===filter||(filter==='Not specified'&&!p.riding_style)||((filter==='Sit-down'||filter==='Stand-up')&&p.riding_style==='Both'))&&matchesSkiBrand(p.ski||'',brand)&&(!point||distance(p)<=radius)&&`${p.name} ${p.map_city} ${p.ski}`.toLowerCase().includes(query.toLowerCase())).sort((a:any,b:any)=>point?distance(a)-distance(b):a.name.localeCompare(b.name));
 const groups=new Map<string,any[]>();riders.forEach(p=>{const k=p.map_lat+','+p.map_lng;groups.set(k,[...(groups.get(k)||[]),p])});
 return <section className="panel"><div className="toolbar"><div><span className="eyebrow">FIND YOUR NEXT CREW</span><h2>Foilers around the world</h2><p>Public, rider-shared city locations. Select a pin to meet the riders there. Numbered pins group riders in one city.</p></div><select aria-label="Filter map by riding style" value={filter} onChange={e=>{setFilter(e.target.value);setSelected(null)}} style={{maxWidth:190}}>{['All styles',...styles,'Not specified'].map(s=><option key={s}>{s}</option>)}</select></div><input aria-label="Search map riders" placeholder="Search rider, city, or ski…" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}}/><div className="nearby-filters"><label className="field">Ski brand<select value={brand} onChange={e=>{setBrand(e.target.value);setSelected(null)}}>{['All skis','Sky Ski','Air Chair','Hyperlite'].map(b=><option key={b}>{b}</option>)}</select></label><label className="field">Find riders near a shared city<select value={near} onChange={e=>{setNear(e.target.value);setSelected(null)}}><option value="">Worldwide</option>{origins.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><label className="field">Within<select value={radius} disabled={!near} onChange={e=>{setRadius(Number(e.target.value));setSelected(null)}}>{[50,100,250,500,1000].map(n=><option value={n} key={n}>{n} km / {Math.round(n*.621371)} miles</option>)}</select></label></div>{near&&<p className="meta">Distances are estimates between shared city centers, not exact rider locations. The rider list is sorted nearest first.</p>}<div className="map-legend">{[...styles,'Not specified','Mixed styles'].map(s=><span key={s}><i style={{background:color(s)}}/>{s==='Sit-down'?'● ':s==='Stand-up'?'◆ ':s==='Both'?'■ ':'○ '}{s}</span>)}</div><p className="map-hint">Drag to move the map. Pinch with two fingers or use Zoom + to see lakes, towns, and roads. State borders and place names appear as you zoom. Choose Map + lake names for labeled waterways. Tap a pin to meet a rider.</p><div className="map-controls" aria-label="Map background">{['Satellite','Map'].map(mode=><button type="button" key={mode} aria-pressed={basemap===mode} onClick={()=>{setBasemap(mode);setFailed(false)}}>{mode==='Satellite'?'Satellite + labels':'Map + lake names'}</button>)}</div><div className="world-map" ref={mapRef}><svg ref={svgRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onClickCapture={e=>{if(suppressClick.current&&e.detail!==0){e.preventDefault();e.stopPropagation()}}} onClick={()=>setSelected(null)} viewBox={`${center[0]-360/zoom} ${center[1]-viewHeight/2/zoom} ${720/zoom} ${viewHeight/zoom}`} aria-label="World map of public foiler locations" role="group"><rect x="0" y="-180" width="720" height="720" fill="#081a29"/>{tiles.map(tile=><image key={`${basemap}-${tile.z}-${tile.x}-${tile.y}`} x={tile.left} y={tile.top} width={tile.size} height={tile.size} preserveAspectRatio="none" pointerEvents="none" href={basemap==='Satellite'?`${arcgis}World_Imagery/MapServer/tile/${tile.z}/${tile.y}/${tile.x}`:`https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`} onError={()=>setFailed(true)}/>)}{basemap==='Satellite'&&tiles.map(tile=><image key={`labels-${tile.z}-${tile.x}-${tile.y}`} x={tile.left} y={tile.top} width={tile.size} height={tile.size} preserveAspectRatio="none" pointerEvents="none" href={`${arcgis}Reference/World_Boundaries_and_Places/MapServer/tile/${tile.z}/${tile.y}/${tile.x}`} onError={()=>setFailed(true)}/>)}{Array.from(groups.entries()).map(([key,group])=>{const [x,y]=mapPoint(group[0].map_lat,group[0].map_lng),s=group.every(p=>p.riding_style===group[0].riding_style)?group[0].riding_style:'Mixed styles',r=5/zoom;return <g key={key} role="button" tabIndex={0} aria-label={`${group.length} ${group.length===1?'rider':'riders'} near ${group[0].map_city}`} aria-expanded={selected?.[0]?.id===group[0].id} aria-controls={selected?.[0]?.id===group[0].id?"map-rider-popup":undefined} onClick={e=>{e.stopPropagation();openPin(group,e.currentTarget)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPin(group,e.currentTarget)}}} style={{cursor:'pointer'}}>{selected?.[0]?.id===group[0].id&&<circle cx={x} cy={y} r={14/zoom} fill="#00b7ff" fillOpacity=".2" stroke="#7edbff" strokeWidth={1.5/zoom}/>}<title>{group.map(p=>p.name+' — '+(p.riding_style||'Not specified')).join(', ')}</title><circle cx={x} cy={y} r={11/zoom} fill="transparent"/>{s==='Stand-up'?<path d={`M${x},${y-r*1.5}L${x+r*1.5},${y}L${x},${y+r*1.5}L${x-r*1.5},${y}Z`} fill={color(s)} stroke="white" strokeWidth={1/zoom}/>:s==='Both'?<rect x={x-r} y={y-r} width={2*r} height={2*r} fill={color(s)} stroke="white" strokeWidth={1/zoom}/>:<circle cx={x} cy={y} r={(group.length>1?8:5)/zoom} fill={color(s)} stroke="white" strokeWidth={1/zoom}/>} {group.length>1&&<text x={x} y={y+2.5/zoom} textAnchor="middle" fill="#050608" fontSize={7/zoom} pointerEvents="none">{group.length}</text>}</g>})}</svg>{selected&&<div id="map-rider-popup" ref={popupRef} className="map-popup" role="region" aria-label={`Riders near ${selected[0].map_city}`} style={popupPosition}>
 <button type="button" className="map-popup-close" aria-label="Close rider information" onClick={closePopup}>×</button>
 <div className="map-popup-heading"><span className="eyebrow">{selected.length===1?'MEET THE RIDER':`${selected.length} RIDERS HERE`}</span><h3>{selected[0].map_city}</h3></div>
 {selected.map((p:any)=><button type="button" className="map-popup-rider" key={p.id} onClick={()=>onSelect(p)}>
 {p.photo?<img src={photoUrl(p.photo)} alt={`${p.name}'s rider photo`} loading="lazy"/>:<span className="map-popup-avatar" aria-hidden="true">{p.name.slice(0,1)}</span>}
 <span className="map-popup-info"><strong>{p.name}</strong><span>{p.riding_style||'Style not listed'} · {p.ski||'Ski not listed'}</span>{point&&<span>About {Math.round(distance(p))} km away</span>}<span className="map-popup-link">View profile →</span></span>
 </button>)}
 <p className="map-popup-note">Approximate city location</p>
 </div>}<div className="map-attribution">{basemap==='Satellite'?<><a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noopener">Imagery © Esri, Vantor, Earthstar Geographics, GIS User Community</a><br/>Labels © Esri, HERE, Garmin, </>:null}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></div></div><div className="map-controls" aria-label="Map controls"><button type="button" onClick={()=>changeZoom(2)} disabled={zoom>=MAX_ZOOM}>Zoom +</button><button type="button" onClick={()=>changeZoom(.5)} disabled={zoom===1}>Zoom −</button>{[['←',-1,0],['→',1,0],['↑',0,-1],['↓',0,1]].map(([label,x,y])=><button key={label} type="button" aria-label={`Pan ${label}`} onClick={()=>setCenter(c=>clampView(zoom,[c[0]+Number(x)*120/zoom,c[1]+Number(y)*90/zoom]).center)}>{label}</button>)}<button type="button" onClick={()=>{setZoom(1);setCenter([360,180])}}>World view</button></div>{failed&&<p>Some map imagery or labels could not load. Try the other map background or check your connection. Rider locations are listed below.</p>}<p className="counter">{riders.length} mapped riders · Approximate locations · <a href="/foilhouse-riders/map/ATTRIBUTION.txt" target="_blank" rel="noopener">Map credits</a></p>{!all.length&&<div className="privacy">Be the first foiler on the map. Open My profile, choose a city, and enable public map visibility. Existing profiles stay off the map until their rider opts in.</div>}<details><summary>Browse mapped riders ({riders.length})</summary>{riders.map(p=><button className="topic" key={p.id} onClick={()=>onSelect(p)}><span><b>{p.name}</b> · {p.map_city}<br/>{p.riding_style||'Not specified'} · {p.ski||'Ski not listed'}{point?' · About '+Math.round(distance(p))+' km away':''}</span><span>View rider →</span></button>)}{!riders.length&&<p>No riders match these filters yet.</p>}</details></section>
}
