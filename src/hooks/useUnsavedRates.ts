'use client';
import {useEffect,useRef} from 'react';

export function useUnsavedRates(dirty:boolean){
 const dirtyRef=useRef(dirty);dirtyRef.current=dirty;
 useEffect(()=>{
  const message='You have unsaved rate changes. Leave without saving?';
  const unload=(event:BeforeUnloadEvent)=>{if(dirtyRef.current){event.preventDefault();event.returnValue='';}};
  const click=(event:MouseEvent)=>{
   if(!dirtyRef.current||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const link=(event.target as Element)?.closest('a[href]') as HTMLAnchorElement|null;
   if(!link||link.target==='_blank'||link.hasAttribute('download')||link.href===location.href)return;
   if(!window.confirm(message)){event.preventDefault();event.stopImmediatePropagation();}
   else dirtyRef.current=false;
  };
  // A same-URL history entry lets Back be cancelled before the router leaves.
  const guardedUrl=location.href;
  const original=window.history.state;
  if(!original?.rateGuard)window.history.pushState({...original,rateGuard:true},'',location.href);
  let returning=false;
  const pop=(event:PopStateEvent)=>{
   if(returning){returning=false;return;}
   if(event.state?.rateGuard||location.href!==guardedUrl)return;
   event.stopImmediatePropagation();
   if(dirtyRef.current&&!window.confirm(message)){returning=true;window.history.forward();}
   else {dirtyRef.current=false;window.removeEventListener('popstate',pop,true);window.history.back();}
  };
  window.addEventListener('beforeunload',unload);
  document.addEventListener('click',click,true);
  window.addEventListener('popstate',pop,true);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);window.removeEventListener('popstate',pop,true);};
 },[]);
}
