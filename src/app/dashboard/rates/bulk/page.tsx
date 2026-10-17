'use client';
import {useState,useEffect,useRef} from 'react';
import Link from 'next/link';
import {eachDayOfInterval,parseISO,format,getDay} from 'date-fns';
import {useRooms} from '@/hooks/useRooms';
import {useRoomRates,rateKey,validRate} from '@/hooks/useRoomRates';
import {hostelToday} from '@/lib/bookingFilters';
export default function BulkRates(){
 const {rooms,loading,error}=useRooms();
 const [start,setStart]=useState(hostelToday());const [end,setEnd]=useState(hostelToday());const [days,setDays]=useState([0,1,2,3,4,5,6]);const [amounts,setAmounts]=useState<Record<number,string>>({});const [saveError,setSaveError]=useState('');const [savedVersion,setSavedVersion]=useState(0);const [notice,setNotice]=useState('');
 const {ready,saveRates,error:storageError}=useRoomRates(start,end);
 const rangeDays=(Date.parse(end)-Date.parse(start))/86400000+1;
 const dates=start&&end&&end>=start&&rangeDays<=3660&&end.slice(0,4)<='2100'?eachDayOfInterval({start:parseISO(start),end:parseISO(end)}).filter(date=>days.includes(getDay(date))):[];
 const chosen=rooms.filter(room=>(amounts[room.room_id]??'').trim()!=='');
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice,savedVersion]);
 const [saving,setSaving]=useState(false);
 const inFlight=useRef(false);
 const submit=async()=>{
   if(inFlight.current)return;
   setNotice('');setSaveError('');
   if(!chosen.length||!dates.length){setSaveError('Enter at least one room rate, a valid date range, and at least one matching day.');return;}
   if(chosen.some(room=>!validRate(amounts[room.room_id]||''))){setSaveError('Enter a valid nightly rate for each room being changed (₹0–₹10,00,000, up to two decimal places).');return;}
   if(chosen.length*dates.length>10000){setSaveError('Choose fewer rooms or dates (maximum 10,000 daily rates per save).');return;}
   inFlight.current=true;setSaving(true);
   try{await saveRates(Object.fromEntries(chosen.flatMap(room=>dates.map(day=>[rateKey(room.room_id,format(day,'yyyy-MM-dd')),Number(amounts[room.room_id])]))));setAmounts({});setNotice('Rates saved successfully.');setSavedVersion(prev=>prev+1);}
   catch(error){setSaveError(error instanceof Error?error.message:'Could not save.');}finally{inFlight.current=false;setSaving(false);}
 };
 const field='mt-2 block w-full rounded-lg border border-slate-300 p-2.5';
 return <div className="mx-auto max-w-3xl p-6 text-slate-900"><Link href="/dashboard/rooms/calendar" className="text-sm text-indigo-600">← Room calendar</Link><h1 className="mt-4 mb-6 text-2xl font-semibold">Bulk update rates</h1>
 {(error||storageError)&&<p role="alert">{error||storageError}</p>}
 {loading?<p>Loading rooms…</p>:<>
 <fieldset disabled={saving} className="space-y-6"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label>From<input type="date" max="2100-12-31" value={start} onChange={e=>setStart(e.target.value)} className={field}/></label><label>To (included)<input type="date" max="2100-12-31" min={start} value={end} onChange={e=>setEnd(e.target.value)} className={field}/></label></div>
 <fieldset><legend className="mb-3 font-medium">Apply on these days</legend><div className="flex flex-wrap gap-3">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((name,id)=><label key={name} className="flex gap-2 rounded-lg border p-2"><input type="checkbox" checked={days.includes(id)} onChange={e=>setDays(prev=>e.target.checked?[...prev,id]:prev.filter(day=>day!==id))}/>{name}</label>)}</div></fieldset>
 <fieldset><legend className="mb-3 font-medium">Rooms</legend>{rooms.map(room=><div key={room.room_id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3"><span>{room.room_name}</span><label className="text-sm text-slate-600">Nightly rate (₹)<input aria-label={`Nightly rate for ${room.room_name}`} type="number" min="0" max="1000000" step="0.01"  value={amounts[room.room_id]??''} onChange={e=>setAmounts(prev=>({...prev,[room.room_id]:e.target.value}))} className="ml-2 w-32 rounded-lg border border-slate-300 p-2 disabled:bg-slate-50 disabled:opacity-50"/></label></div>)}</fieldset></fieldset>
 {saveError&&<p role="alert" className="mt-4 text-sm text-red-700">{saveError}</p>}
 {notice&&<p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}<div className="mt-6 flex justify-end"><button disabled={!ready||!rooms.length||saving} onClick={submit} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{saving?'Saving…':'Save'}</button></div></>}
 </div>;
}
