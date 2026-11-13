import {Fragment} from 'react';
export default function LinkedText({text}:{text:string}){
 return <>{String(text||'').split(/(https?:\/\/[^\s<>]+)/g).map((part,i)=>{
  if(!/^https?:\/\//i.test(part))return <Fragment key={i}>{part}</Fragment>;
  const url=part.replace(/[.,!?;:]+$/,'');const suffix=part.slice(url.length);
  return <Fragment key={i}><a href={url} target="_blank" rel="noopener noreferrer" style={{overflowWrap:'anywhere'}}>{url}</a>{suffix}</Fragment>;
 })}</>
}
