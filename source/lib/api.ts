import {createClient} from '@supabase/supabase-js';
export const SUPABASE_URL='https://oogizjynlhjmtybxayjq.supabase.co';
export const PUBLIC_KEY='sb_publishable_SLw3KnAEfQSSRly9mkhYMQ_6MMGzo7x';
export const BASE='/foilhouse-riders/';
export const API=SUPABASE_URL+'/functions/v1/riders-api';
export const supabase=createClient(SUPABASE_URL,PUBLIC_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export function photoUrl(id:string){return API+'?route=photo&id='+encodeURIComponent(id)}
export const authReady=(async()=>{
 const params=new URLSearchParams(location.search),type=params.get('type');
 if(params.get('token_hash')&&['signup','recovery','email','email_change','invite'].includes(type||'')){
  const {error}=await supabase.auth.verifyOtp({token_hash:params.get('token_hash')!,type:type as any});
  if(error){location.replace(BASE+'rider-login/?error=confirmation');return}
  location.replace(BASE+(type==='recovery'?'rider-login/?mode=update':'riders/?tab=profile'));return;
 }
 await supabase.auth.getSession();
 if(params.has('code')||location.hash.includes('access_token=')){
  history.replaceState(null,'',BASE+'rider-login/'+(type==='recovery'||params.get('mode')==='update'?'?mode=update':''));
 }
})();
function json(data:any,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})}
async function emailAuth(init:RequestInit={}){
 if(!init.method||init.method==='GET')return json({ready:true});
 try{
 const b=JSON.parse(String(init.body));let result:any,message='';
 if(b.action==='signin')result=await supabase.auth.signInWithPassword({email:b.email,password:b.password});
 else if(b.action==='signup'){
  if(!b.consent||b.password?.length<12)return json({error:'Confirm the guidelines and use at least 12 characters.'},400);
  result=await supabase.auth.signUp({email:b.email,password:b.password,options:{emailRedirectTo:location.origin+BASE+'rider-login/'}});message='Check your email to confirm your rider account, then sign in.';
 }else if(b.action==='reset'){
  result=await supabase.auth.resetPasswordForEmail(b.email,{redirectTo:location.origin+BASE+'rider-login/?mode=update'});message='If an account exists, a password reset email will arrive shortly.';
 }else if(b.action==='update-password'){
  if(b.password?.length<12)return json({error:'Use at least 12 characters.'},400);
  result=await supabase.auth.updateUser({password:b.password});
 }else if(b.action==='signout')result=await supabase.auth.signOut();
 else return json({error:'Unknown account action'},400);
 if(result.error)return json({error:result.error.message},400);
 return json({ok:true,message});
 }catch{return json({error:'Could not complete the account request. Try again.'},400)}
}
export async function apiFetch(input:string,init:RequestInit={}){
 if(input==='/api/email-auth')return emailAuth(init);
 if(!input.startsWith('/api/'))return fetch(input,init);
 const path=new URL(input,location.origin),route=path.pathname.slice(5);
 const url=new URL(API);url.search=new URLSearchParams(path.search);url.searchParams.set('route',route);
 const {data:{session}}=await supabase.auth.getSession();const headers=new Headers(init.headers);
 headers.set('apikey',PUBLIC_KEY);if(session?.access_token)headers.set('Authorization','Bearer '+session.access_token);
 return fetch(url,{...init,headers});
}
