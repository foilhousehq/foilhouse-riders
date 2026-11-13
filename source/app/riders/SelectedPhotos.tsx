import {useEffect,useState} from 'react';
export default function SelectedPhotos({files,remove,clear,disabled}:{files:File[];remove:(index:number)=>void;clear:()=>void;disabled:boolean}){
 const [previews,setPreviews]=useState<{file:File;url:string}[]>([]);
 useEffect(()=>{const next=files.map(file=>({file,url:URL.createObjectURL(file)}));setPreviews(next);return()=>next.forEach(p=>URL.revokeObjectURL(p.url))},[files]);
 if(!files.length)return null;
 return <section className="selected-photos" aria-label="Photos selected for upload"><div className="toolbar"><h3>Selected photos ({files.length})</h3><button type="button" className="textbtn danger" disabled={disabled} onClick={clear}>Remove all selected photos</button></div><p className="meta">These photos are not uploaded yet. Remove any you don’t want before tapping Publish.</p><div className="photo-grid">{previews.map((p,i)=><figure key={p.url}><img src={p.url} alt={`Selected photo ${i+1}: ${p.file.name}`}/><figcaption><span>{p.file.name}</span><button type="button" className="button secondary" disabled={disabled} aria-label={`Remove selected photo ${i+1}: ${p.file.name}`} onClick={()=>remove(i)}>Remove photo</button></figcaption></figure>)}</div></section>
}
