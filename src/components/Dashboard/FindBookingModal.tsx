'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {format,parseISO} from 'date-fns';
import {searchBookings,BookingSearchResult} from '@/lib/api';

export default function FindBookingModal({onClose,onSelect,opening,openError}:{onClose:()=>void;onSelect:(id:number)=>Promise<void>;opening:boolean;openError:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 const input=useRef<HTMLInputElement>(null);
 const [query,setQuery]=useState('');
 const [results,setResults]=useState<BookingSearchResult[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{const element=dialog.current;const previous=document.activeElement as HTMLElement|null;element?.showModal();input.current?.focus();return()=>{element?.close();previous?.focus();};},[]);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  setResults([]);setError('');
  const term=query.trim();setLoading(term.length>=2);
  if(term.length<2)return()=>controller.abort();
  const timer=setTimeout(async()=>{
   try{const rows=await searchBookings(term,controller.signal);if(active)setResults(rows);}
   catch{if(active)setError('Could not search bookings. Please try again.');}
   finally{if(active)setLoading(false);}
  },250);
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[query,retry]);
 return <dialog ref={dialog} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50" aria-labelledby="find-booking-title">
  <div className="p-5">
   <div className="mb-4 flex items-center justify-between"><h2 id="find-booking-title" className="text-lg font-semibold">Find booking</h2><button onClick={onClose} aria-label="Close search" className="rounded px-2 py-1 text-xl hover:bg-slate-100">×</button></div>
   <label htmlFor="booking-search" className="mb-2 block text-sm text-slate-600">Name or contact number</label>
   <input ref={input} autoFocus id="booking-search" type="search" maxLength={100} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Start typing to search…" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-indigo-600" aria-controls="booking-search-results" />
   <div aria-live="polite" className="mt-3 text-sm text-slate-500">{opening?'Opening booking…':loading?'Searching…':query.trim().length<2?'Enter at least 2 characters.':!error&&!results.length?'No bookings found. Try another name or number.':''}</div>
   {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error} <button className="underline" onClick={()=>setRetry(value=>value+1)}>Retry</button></p>}
   {openError&&<p role="alert" className="mt-3 text-sm text-red-700">{openError}</p>}
   <ul id="booking-search-results" aria-label="Matching bookings" className="mt-2 max-h-[45vh] overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100 empty:hidden">
    {results.map(booking=><li key={booking.booking_id}><button disabled={opening} onClick={()=>void onSelect(booking.booking_id)} className="w-full px-3 py-3 text-left hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-indigo-600 disabled:opacity-50"><span className="block text-sm font-medium">{booking.booking_name} <span className="font-normal text-slate-400">#{booking.booking_id}</span></span><span className="mt-1 block text-xs text-slate-500">{format(parseISO(booking.check_in),'d MMM yyyy')} – {format(parseISO(booking.check_out),'d MMM yyyy')} · {booking.number_of_adults} guest{booking.number_of_adults===1?'':'s'}{booking.contact_number?` · ${booking.contact_number}`:''}</span></button></li>)}
   </ul>
   {results.length===20&&<p className="mt-2 text-xs text-slate-500">Showing 20 matches. Keep typing to narrow your search.</p>}
   <div className="mt-4 border-t border-slate-100 pt-4"><Link href="/dashboard/bookings" className="text-sm font-medium text-indigo-600 hover:underline">View all bookings →</Link></div>
  </div>
 </dialog>;
}
