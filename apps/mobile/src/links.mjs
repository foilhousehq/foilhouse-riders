export const SITE='https://foilhousehq.github.io/foilhouse-riders/';
export const communityLink=tab=>SITE+'riders/'+(tab?'?tab='+encodeURIComponent(tab):'');
export function isInternalUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='foilhousehq.github.io'&&(url.pathname==='/foilhouse-riders'||url.pathname.startsWith('/foilhouse-riders/'))}catch{return false}
}
export function canOpenExternally(value){
 try{return ['https:','mailto:','tel:'].includes(new URL(value).protocol)}catch{return false}
}
export function eventLink(id){if(!Number.isInteger(id)||id<1||id>15)throw Error('Unknown event');return communityLink('events')+'&event='+id}
export function shareableUrl(value){
 try{const url=new URL(value);if(!isInternalUrl(value)||/rider-login|auth\//.test(url.pathname))return SITE;
 for(const key of [...url.searchParams.keys()])if(!['tab','event','thread'].includes(key))url.searchParams.delete(key);
 if(!/^#(?:calendar|event-\d+)?$/.test(url.hash))url.hash='';return url.toString();
 }catch{return SITE}
}
