'use client';
import { useEffect, useState } from 'react';
export type RoomRates = Record<string, number>;
import {getRoomRates,saveRoomRates} from '@/lib/api';
export const rateKey=(room:number,day:string)=>`${room}:${day}`;
export const validRate=(value:string)=>/^\d+(\.\d{1,2})?$/.test(value)&&Number(value)<=1000000;
export function formatRate(value?:number){return value==null?'Set rate':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);}
export function useRoomRates(start:string,end:string){
 const [snapshot,setSnapshot]=useState<{key:string;rates:RoomRates}|null>(null);const [error,setError]=useState('');
 const key=`${start}:${end}`;
 useEffect(()=>{let active=true,request=0;const read=async()=>{
  const id=++request;setError('');
  if(!start||!end||end<start)return;
  try{const result=await getRoomRates(start,end);if(active&&id===request)setSnapshot({key,rates:result.rates});}
  catch{if(active&&id===request)setError('Could not load room rates. Refresh to try again.');}
 };void read();window.addEventListener('room-rates-updated',read);return()=>{active=false;window.removeEventListener('room-rates-updated',read);};},[start,end,key]);
 const saveRates=async(updates:Record<string,number|null>)=>{
  await saveRoomRates(Object.entries(updates).map(([key,rate])=>{const [room,date]=key.split(':');return {room_id:Number(room),date,rate};}));
  setSnapshot(prev=>{if(!prev)return prev;const rates={...prev.rates};for(const [key,value] of Object.entries(updates)){if(value===null)delete rates[key];else rates[key]=value;}return {...prev,rates};});
  window.dispatchEvent(new Event('room-rates-updated'));
 };
 return {rates:snapshot?.key===key?snapshot.rates:{},ready:snapshot?.key===key,error,saveRates};
}
