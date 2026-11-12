import {router,useLocalSearchParams} from 'expo-router';
import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, BackHandler, FlatList, Image, Linking, Pressable, Share, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WebView} from 'react-native-webview';
import type {WebViewNavigation} from 'react-native-webview';
import initialEvents from './src/events.json';
import {SITE, communityLink, eventLink, isInternalUrl, canOpenExternally, shareableUrl} from './src/links.mjs';

type TourEvent=typeof initialEvents[number];
type Tab='Events'|'Map'|'Forum'|'Photos'|'Profile';
const tabs: {name:Tab;symbol:string;route?:string}[]=[{name:'Events',symbol:'▦'},{name:'Map',symbol:'◎',route:'map'},{name:'Forum',symbol:'☷'},{name:'Photos',symbol:'▧',route:'events'},{name:'Profile',symbol:'◉',route:'profile'}];
const FAVORITES='foilhouse-app-favorites-v1',EVENT_CACHE='foilhouse-app-events-v1';

export default function App(){return <SafeAreaProvider><RidersApp/></SafeAreaProvider>}
function RidersApp(){
 const params=useLocalSearchParams<{section:string}>();
 const tab:Tab=tabs.some(t=>t.name===params.section)?params.section as Tab:'Events';
 const setTab=(next:Tab)=>router.replace({pathname:'/[section]',params:{section:next}});
 const [events,setEvents]=useState<TourEvent[]>(initialEvents),[saved,setSaved]=useState<number[]>([]),[ready,setReady]=useState(false),[query,setQuery]=useState(''),[onlySaved,setOnlySaved]=useState(false),[region,setRegion]=useState('All');
 const [source,setSource]=useState(()=>communityLink(tabs.find(t=>t.name===tab)?.route)),[currentUrl,setCurrentUrl]=useState(communityLink()),[navigationKey,setNavigationKey]=useState(0),[canGoBack,setCanGoBack]=useState(false),[loading,setLoading]=useState(false),[webError,setWebError]=useState('');
 const web=useRef<WebView<object>>(null),hydrated=useRef(false),savedRef=useRef<number[]>([]),saveQueue=useRef(Promise.resolve());
 const webVisible=tab!=='Events';
 useEffect(()=>{
  let active=true;
  AsyncStorage.multiGet([FAVORITES,EVENT_CACHE]).then(rows=>{
   if(!active)return;
   try{const favorites=JSON.parse(rows[0][1]||'[]');if(Array.isArray(favorites)){const ids=favorites.filter((id:unknown)=>Number.isInteger(id)&&Number(id)>=1&&Number(id)<=15);setSaved(ids);savedRef.current=ids}}catch{}
   try{const cached=JSON.parse(rows[1][1]||'null');if(validEvents(cached))setEvents(cached)}catch{}
  }).catch(()=>Alert.alert('Saved events unavailable','Favorites could not be loaded on this device.')).finally(()=>{if(active){hydrated.current=true;setReady(true)}});
  const controller=new AbortController();
  fetch(SITE+'events.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(next=>{if(active&&validEvents(next)){setEvents(next);void AsyncStorage.setItem(EVENT_CACHE,JSON.stringify(next)).catch(()=>{})}}).catch(()=>{});
  return()=>{active=false;controller.abort()};
 },[]);
 useEffect(()=>{const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(!webVisible)return false;if(canGoBack)web.current?.goBack();else setTab('Events');return true});return()=>subscription.remove()},[webVisible,canGoBack]);
 function validEvents(value:unknown):value is TourEvent[]{return Array.isArray(value)&&value.length===15&&value.every(e=>Number.isInteger(e.id)&&typeof e.name==='string'&&typeof e.location==='string'&&typeof e.dates==='string')}
 function selectTab(next:Tab){setTab(next);if(next!=='Events'){setNavigationKey(n=>n+1);setCanGoBack(false);const target=tabs.find(t=>t.name===next)!;setSource(communityLink(target.route));setWebError('')}}
 function openEvent(event:TourEvent){setNavigationKey(n=>n+1);setCanGoBack(false);setTab('Photos');setSource(eventLink(event.id));setWebError('')}
 function toggleSaved(id:number){
  if(!hydrated.current)return;
  const next=savedRef.current.includes(id)?savedRef.current.filter(x=>x!==id):[...savedRef.current,id];savedRef.current=next;setSaved(next);
  saveQueue.current=saveQueue.current.then(()=>AsyncStorage.setItem(FAVORITES,JSON.stringify(next))).catch(()=>{Alert.alert('Could not save on this device','Please try again.');});
 }
 async function share(url:string,message?:string){try{await Share.share({message:(message?message+'\n':'')+shareableUrl(url)})}catch{Alert.alert('Could not open sharing','Please try again.')}}
 async function openOutside(url:string){if(!canOpenExternally(url))return;try{await Linking.openURL(url)}catch{Alert.alert('Could not open link','Open this link from your browser instead.')}}
 function navigationChanged(state:WebViewNavigation){setCanGoBack(state.canGoBack);setCurrentUrl(state.url)}
 const filtered=events.filter(e=>(region==='All'||e.region===region)&&(!onlySaved||saved.includes(e.id))&&(e.name+' '+e.location).toLowerCase().includes(query.toLowerCase()));
 return <SafeAreaView style={s.safe} edges={['top','left','right','bottom']}><StatusBar style="light"/>
  <View style={s.header}><Image source={require('./assets/foilhouse-logo.png')} style={s.logo} resizeMode="contain" accessibilityLabel="FOILHOUSE HQ"/><Text style={s.appName}>RIDERS</Text></View>
  <View style={[s.body,webVisible&&s.hidden]}>
   <FlatList data={filtered} keyExtractor={e=>String(e.id)} contentContainerStyle={s.list} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<><Text style={s.eyebrow}>YOUR PEOPLE. YOUR NEXT RIDE.</Text><Text style={s.title}>The 2027 season.</Text><Text style={s.description}>Find your next crew. Save events for your season and share the ride.</Text><TextInput style={s.search} value={query} onChangeText={setQuery} placeholder="Search events or lakes…" placeholderTextColor="#a9becd" accessibilityLabel="Search events"/>
     <View style={s.filters}>{[{value:'All',label:'All events'},{value:'us',label:'U.S. tour'},{value:'nz',label:'New Zealand'}].map(r=><Pressable key={r.value} style={[s.chip,region===r.value&&s.activeChip]} onPress={()=>setRegion(r.value)} accessibilityRole="button" accessibilityState={{selected:region===r.value}}><Text style={[s.chipText,region===r.value&&s.activeText]}>{r.label}</Text></Pressable>)}</View>
     <Pressable onPress={()=>setOnlySaved(v=>!v)} style={s.savedFilter} accessibilityRole="checkbox" accessibilityState={{checked:onlySaved}}><Text style={s.link}>{onlySaved?'★ Showing saved events':'☆ Show my saved events'} · {saved.length}</Text></Pressable>
     <Text style={s.note}>Exact dates and registration details may change. Confirm with the organizer before booking travel. Saved events on this phone are separate from website favorites.</Text>
    </>}
    renderItem={({item:e})=><View style={s.card}><View style={s.cardTop}><Text style={s.eyebrow}>{new Date(2027,e.month-1).toLocaleString('en-US',{month:'long'}).toUpperCase()} / 27</Text><Pressable disabled={!ready} accessibilityRole="button" accessibilityLabel={(saved.includes(e.id)?'Unsave ':'Save ')+e.name} hitSlop={12} onPress={()=>toggleSaved(e.id)}><Text style={s.star}>{saved.includes(e.id)?'★':'☆'}</Text></Pressable></View><Text style={s.eventTitle}>{e.name}</Text><Text style={s.location}>{e.location}</Text><Text style={s.dates}>{e.dates}</Text><View style={s.cardActions}><Pressable style={s.button} onPress={()=>openEvent(e)} accessibilityRole="button"><Text style={s.buttonText}>Crew & photos →</Text></Pressable><Pressable onPress={()=>share(eventLink(e.id),e.name+' · '+e.location)} accessibilityRole="button" accessibilityLabel={'Share '+e.name}><Text style={s.link}>Share ↗</Text></Pressable></View></View>}
    ListEmptyComponent={<Text style={s.empty}>{onlySaved?'Save an event with the star to see it here.':'No events match your search.'}</Text>}
    ListFooterComponent={<View style={s.lessonCard}><Text style={s.eventTitle}>Come ride with us.</Text><Text style={s.description}>Lessons and demos take place only at Jackson Lake, Georgia.</Text><Pressable style={s.button} onPress={()=>{setNavigationKey(n=>n+1);setCanGoBack(false);setTab('Profile');setSource(communityLink('lessons'));setWebError('')}} accessibilityRole="button"><Text style={s.buttonText}>Ask about lessons →</Text></Pressable></View>}
   />
  </View>
  <View style={[s.webArea,!webVisible&&s.hidden]}>
   <View style={s.webTools}><Pressable disabled={!canGoBack} onPress={()=>web.current?.goBack()} accessibilityRole="button" accessibilityLabel="Go back" style={[s.tool,!canGoBack&&s.disabled]}><Text style={s.link}>← Back</Text></Pressable><Text style={s.sectionName}>{tab}</Text><Pressable onPress={()=>share(currentUrl)} accessibilityRole="button" accessibilityLabel="Share this page" style={s.tool}><Text style={s.link}>Share ↗</Text></Pressable></View>
   {loading&&!webError&&<ActivityIndicator color="#00b7ff" style={s.loader} accessibilityLabel="Loading Riders"/>}
   <WebView<object> key={navigationKey} ref={web} source={{uri:source}} style={s.web} domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled javaScriptEnabled setSupportMultipleWindows
    originWhitelist={['https://*','mailto:*','tel:*']} allowsBackForwardNavigationGestures
    onNavigationStateChange={navigationChanged} onLoadStart={()=>{setLoading(true);setWebError('')}} onLoadEnd={()=>setLoading(false)}
    onError={()=>{setLoading(false);setWebError('Could not load the community. Check your connection, then try again.')}}
    onHttpError={e=>{if(e.nativeEvent.url===source){setLoading(false);setWebError('The community is temporarily unavailable. Please try again.')}}}
    onShouldStartLoadWithRequest={request=>{if(isInternalUrl(request.url)||request.url==='about:blank')return true;void openOutside(request.url);return false}}
    onOpenWindow={e=>{const url=e.nativeEvent.targetUrl;if(isInternalUrl(url)){setSource(url);setWebError('')}else void openOutside(url)}}
   />
   {!!webError&&<View style={s.error}><Text style={s.description}>{webError}</Text><Pressable style={s.button} onPress={()=>{setWebError('');web.current?.reload()}} accessibilityRole="button"><Text style={s.buttonText}>Try again</Text></Pressable><Pressable onPress={()=>selectTab('Events')} accessibilityRole="button"><Text style={s.link}>View saved event calendar</Text></Pressable></View>}
  </View>
  <View style={s.tabBar}>{tabs.map(t=><Pressable key={t.name} style={s.tab} accessibilityRole="tab" accessibilityState={{selected:tab===t.name}} onPress={()=>selectTab(t.name)}><Text style={[s.tabIcon,tab===t.name&&s.selected]}>{t.symbol}</Text><Text style={[s.tabText,tab===t.name&&s.selected]}>{t.name}</Text></Pressable>)}</View>
 </SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#050608'},body:{flex:1},hidden:{display:'none'},header:{backgroundColor:'#000',flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:17,borderBottomWidth:1,borderColor:'#293743'},logo:{width:210,height:22},appName:{color:'#00b7ff',fontSize:11,fontWeight:'800',letterSpacing:2},list:{padding:20,paddingBottom:35},eyebrow:{color:'#00b7ff',fontSize:11,fontWeight:'800',letterSpacing:1.5},title:{fontSize:35,lineHeight:42,fontWeight:'800',letterSpacing:-1.2,color:'#fff',marginTop:12},description:{fontSize:15,lineHeight:23,color:'#c5d5e1',marginVertical:12},search:{borderColor:'#35566c',borderWidth:1,borderRadius:8,padding:15,color:'#fff',fontSize:15,backgroundColor:'#101419',marginVertical:12},filters:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:12,paddingVertical:12,borderRadius:6,borderWidth:1,borderColor:'#35566c',backgroundColor:'#101419'},activeChip:{backgroundColor:'#00b7ff',borderColor:'#00b7ff'},chipText:{color:'#d5e2ec',fontSize:12,fontWeight:'700'},activeText:{color:'#050608'},savedFilter:{paddingVertical:18},note:{color:'#a9becd',fontSize:12,lineHeight:18,marginBottom:20},card:{padding:20,borderWidth:1,borderColor:'#293743',borderRadius:12,backgroundColor:'#101419',marginBottom:14},cardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},star:{fontSize:30,color:'#00b7ff'},eventTitle:{fontSize:23,fontWeight:'800',lineHeight:29,color:'#fff',marginTop:8},location:{color:'#c5d5e1',fontSize:15,marginVertical:12},dates:{color:'#c5d5e1',fontSize:13,borderTopWidth:1,borderColor:'#293743',paddingTop:13,marginTop:3},cardActions:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14,marginTop:20},button:{backgroundColor:'#00b7ff',borderRadius:6,paddingHorizontal:16,paddingVertical:14,alignSelf:'flex-start'},buttonText:{color:'#050608',fontSize:13,fontWeight:'800'},link:{color:'#70dbff',fontSize:13,fontWeight:'700'},empty:{color:'#c5d5e1',paddingVertical:30,fontSize:16},lessonCard:{padding:22,borderWidth:1,borderColor:'#35566c',borderRadius:12,backgroundColor:'#102d40',marginTop:10},webArea:{flex:1,backgroundColor:'#050608'},web:{flex:1,backgroundColor:'#050608'},webTools:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:12,borderBottomWidth:1,borderColor:'#293743'},sectionName:{color:'#fff',fontSize:14,fontWeight:'700'},tool:{padding:8},disabled:{opacity:.35},loader:{position:'absolute',top:65,alignSelf:'center',zIndex:2},error:{position:'absolute',left:0,right:0,bottom:0,top:60,backgroundColor:'#101419',padding:28,justifyContent:'center',gap:20},tabBar:{flexDirection:'row',backgroundColor:'#0b1016',borderTopWidth:1,borderColor:'#293743'},tab:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:12,minHeight:65},tabIcon:{color:'#a9becd',fontSize:23},tabText:{color:'#a9becd',fontSize:10,fontWeight:'700',marginTop:5},selected:{color:'#00b7ff'}
});
