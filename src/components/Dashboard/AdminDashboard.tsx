'use client';

import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import {format,parseISO} from 'date-fns';
import {hostelToday} from '@/lib/bookingFilters';
import {useDashboard} from '@/hooks/useDashboard';
import {getBookingWithBedsAndRooms} from '@/lib/api';
import {Booking} from '@/types';
import CollectPaymentButton from '@/components/Bookings/CollectPaymentButton';
import PendingExtras from '@/components/Extras/PendingExtras';
import FindBookingModal from './FindBookingModal';
import AddBookingModal from '@/components/Bookings/AddBookingModal';
import BookingDetailsModal from '@/components/Bookings/BookingDetailsModal';

const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
const panel='rounded-xl border border-slate-200 bg-white';
const button='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-indigo-600';

export default function AdminDashboard(){
  const {data,error,loading,refresh}=useDashboard();
  const today=data?.today??hostelToday();
  const [active,setActive]=useState<'arrivals'|'departures'>('arrivals');
  const [balanceOnly,setBalanceOnly]=useState(false);
  const [detail,setDetail]=useState<Booking|null>(null);
  const [finding,setFinding]=useState(false);
  const [newBooking,setNewBooking]=useState(false);
  const [notice,setNotice]=useState('');
  const [opening,setOpening]=useState(false);
  const detailRequest=useRef(0);
  useEffect(()=>()=>{++detailRequest.current;},[]);
  const openBooking=async(id:number)=>{const request=++detailRequest.current;setOpening(true);setNotice('');try{const booking=await getBookingWithBedsAndRooms(id);if(request===detailRequest.current){setDetail(booking);setFinding(false);}}catch{if(request===detailRequest.current)setNotice('Could not open booking. Please try again.');}finally{if(request===detailRequest.current)setOpening(false);}};

  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
  const date=parseISO(today);
  const rooms=data?.rooms??[],arrivals=data?.arrivals??[],departures=data?.departures??[];
  const unpaidArrivals=arrivals.filter(stay=>stay.balance>5),unpaidDepartures=departures.filter(stay=>stay.balance>5);
  const list=(active==='arrivals'?arrivals:departures).filter(stay=>!balanceOnly||stay.balance>5);
  const showList=(type:'arrivals'|'departures',unpaid=false)=>{setActive(type);setBalanceOnly(unpaid);document.getElementById('dashboard-stays')?.scrollIntoView({behavior:'smooth',block:'nearest'});};
  return <div className="space-y-6 text-slate-900">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm text-slate-500">{format(date,'EEEE, d MMMM yyyy')}</p><h2 className="mt-1 text-2xl font-semibold">Today at a glance</h2></div>
      <div className="flex flex-wrap gap-2"><button className={button} onClick={()=>{setNotice('');setFinding(true);}}>Find booking</button><Link className={button} href="/dashboard/rooms/calendar">Room calendar</Link><button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" onClick={()=>setNewBooking(true)}>+ New booking</button></div>
    </header>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} <button onClick={()=>void refresh()} className="underline">Retry</button></p>}
    {loading&&<p role="status" className="text-sm text-slate-500">{data?'Refreshing dashboard…':'Loading dashboard…'}</p>}
    {opening&&<p role="status" className="text-sm text-slate-500">Opening booking…</p>}
    {notice&&<p role="status" className="text-sm text-red-700">{notice}</p>}
    {data&&<>
    <section aria-label="Today's overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Link href="/dashboard/rooms/calendar" className={`${panel} p-4 hover:border-indigo-300`}><p className="text-sm text-slate-500">Available beds</p><p className="mt-2 text-3xl font-semibold tabular-nums">{data.available} <span className="text-sm font-normal text-slate-500">/ {data.total}</span></p><p className="mt-2 text-xs text-slate-500">Tonight · Across {rooms.length} rooms →</p></Link>
      <Link href="/dashboard/rooms/calendar" className={`${panel} p-4 hover:border-indigo-300`}><p className="text-sm text-slate-500">Occupancy</p><p className="mt-2 text-3xl font-semibold tabular-nums">{data.occupancy}<span className="text-xl">%</span></p><p className="mt-2 text-xs text-slate-500">{data.occupied} beds booked tonight →</p></Link>
      <button onClick={()=>showList('arrivals')} className={`${panel} p-4 text-left hover:border-indigo-300`}><p className="text-sm text-slate-500">Arriving today</p><p className="mt-2 text-3xl font-semibold tabular-nums">{arrivals.reduce((sum,stay)=>sum+stay.guests,0)} <span className="text-sm font-normal text-slate-500">guests</span></p><p className="mt-2 text-xs text-slate-500">{arrivals.length} booking{arrivals.length===1?'':'s'} · View arrivals ↓</p></button>
      <button onClick={()=>showList('departures')} className={`${panel} p-4 text-left hover:border-indigo-300`}><p className="text-sm text-slate-500">Departing today</p><p className="mt-2 text-3xl font-semibold tabular-nums">{departures.reduce((sum,stay)=>sum+stay.guests,0)} <span className="text-sm font-normal text-slate-500">guests</span></p><p className="mt-2 text-xs text-slate-500">{departures.length} booking{departures.length===1?'':'s'} · View departures ↓</p></button>
    </section>
    <div className="grid gap-5 xl:grid-cols-3">
      <section className={`${panel} min-w-0 xl:col-span-2`} aria-labelledby="rooms-today-heading"><div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-4 py-4"><h3 id="rooms-today-heading" className="font-semibold">Rooms today</h3><span className="text-xs text-slate-500">₹ per bed / night · Excluding taxes</span></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="px-4 py-3 font-medium">Room</th><th className="px-4 py-3 text-right font-medium">Rate</th><th className="px-4 py-3 text-right font-medium">Availability</th></tr></thead><tbody className="divide-y divide-slate-100">{rooms.map(room=><tr key={room.id}><td className="px-4 py-3">{room.name}</td><td className="px-4 py-3 text-right tabular-nums">{money(room.rate)}</td><td className="px-4 py-3 text-right"><span className="whitespace-nowrap rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">{room.free} available</span></td></tr>)}</tbody></table></div></section>
      <section className={`${panel} p-4`} aria-labelledby="attention-heading"><h3 id="attention-heading" className="font-semibold">Needs attention</h3><div className="mt-4 space-y-3"><button className="w-full rounded-lg bg-amber-50 p-3 text-left hover:bg-amber-100" onClick={()=>showList('departures',true)}><p className="text-sm font-medium text-amber-900">{unpaidDepartures.length} departure{unpaidDepartures.length===1?'':'s'} with a balance due →</p><p className="mt-1 text-sm text-amber-800">{money(unpaidDepartures.reduce((sum,stay)=>sum+stay.balance,0))} to collect before departure</p></button><button className="w-full rounded-lg bg-slate-50 p-3 text-left hover:bg-slate-100" onClick={()=>showList('arrivals',true)}><p className="text-sm font-medium">{unpaidArrivals.length} arrival{unpaidArrivals.length===1?'':'s'} with a balance due →</p><p className="mt-1 text-sm text-slate-500">{money(unpaidArrivals.reduce((sum,stay)=>sum+stay.balance,0))} outstanding</p></button></div></section>
    </div>
    <PendingExtras/>
    <section id="dashboard-stays" className={panel} aria-labelledby="stays-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><h3 id="stays-heading" className="font-semibold">Today’s bookings</h3><div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Booking list"><button aria-pressed={active==='arrivals'} className={`rounded-md px-3 py-1.5 text-sm ${active==='arrivals'?'bg-white font-medium shadow-sm':'text-slate-500'}`} onClick={()=>{setActive('arrivals');setBalanceOnly(false);}}>Arrivals · {arrivals.length}</button><button aria-pressed={active==='departures'} className={`rounded-md px-3 py-1.5 text-sm ${active==='departures'?'bg-white font-medium shadow-sm':'text-slate-500'}`} onClick={()=>{setActive('departures');setBalanceOnly(false);}}>Departures · {departures.length}</button></div></div>
      {balanceOnly&&<div className="flex items-center justify-between bg-amber-50 px-4 py-2 text-sm"><span>With outstanding balances</span><button onClick={()=>setBalanceOnly(false)} className="underline">Show all</button></div>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3 font-medium">Booking</th><th className="px-4 py-3 font-medium">Guests</th><th className="px-4 py-3 font-medium">Room</th><th className="px-4 py-3 text-right font-medium">Balance due</th><th className="px-4 py-3"><span className="sr-only">Open booking</span></th></tr></thead><tbody className="divide-y divide-slate-100">{list.map(stay=><tr key={stay.id} className="group"><td className="whitespace-nowrap px-4 py-3 font-medium">{stay.name}</td><td className="px-4 py-3">{stay.guests}</td><td className="px-4 py-3 text-slate-600">{stay.room}</td><td className={`px-4 py-3 text-right tabular-nums ${stay.balance?'text-amber-800':'text-emerald-700'}`}>{stay.balance?money(stay.balance):'Paid'}<div className="mt-1"><CollectPaymentButton id={stay.id} name={stay.name} pending={stay.balance} onSaved={refresh}/></div></td><td className="px-4 py-3 text-right"><button className="text-indigo-600 hover:underline" aria-label={`Open booking for ${stay.name}`} disabled={opening} onClick={()=>void openBooking(stay.id)}>Open</button></td></tr>)}</tbody></table></div>
      {!list.length&&<p className="p-6 text-sm text-slate-500">{balanceOnly?'No outstanding balances in this list.':`No ${active} today.`}</p>}
    </section>
    <section aria-labelledby="sales-heading"><div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h3 id="sales-heading" className="font-semibold">This month <span className="font-normal text-slate-500">· {format(date,'MMMM yyyy')}</span></h3></div><div className="grid gap-3 md:grid-cols-3">{[{label:'Accommodation sales',value:data.monthly.sales,note:'Agreed booking price prorated by nights · Excluding taxes'},{label:'Payments received',value:data.monthly.received,note:'Net payments recorded this month · Includes corrections'},{label:'Outstanding balance',value:data.monthly.outstanding,note:'Whole balances on bookings staying this month'}].map(item=><div className={`${panel} p-4`} key={item.label}><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{money(item.value)}</p><p className="mt-2 text-xs text-slate-500">{item.note}</p></div>)}</div>{data.monthly.undatedCount>0&&<p className="mt-2 text-xs text-slate-500">{data.monthly.undatedCount} older payment totals have no recorded date and are excluded from payments received.</p>}</section>
    <section className={`${panel} p-4`} aria-labelledby="week-heading"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 id="week-heading" className="font-semibold">Next 7 days</h3><span className="text-xs text-slate-500">Available beds per night</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">{data.week.map(({date:day,free},index)=><Link href="/dashboard/rooms/calendar" key={index} aria-label={`${free} beds available on ${format(parseISO(day),'d MMM')}; open calendar`} className={`rounded-lg p-3 text-center hover:ring-1 hover:ring-indigo-300 ${index===0?'bg-indigo-50':'bg-slate-50'}`}><p className="text-xs text-slate-500">{index===0?'Today':format(parseISO(day),'EEE')} · {format(parseISO(day),'d MMM')}</p><p className="mt-2 text-lg font-semibold tabular-nums">{free}</p><p className="text-xs text-slate-500">available</p></Link>)}</div></section>
    </>}
    {finding&&<FindBookingModal onClose={()=>{++detailRequest.current;setOpening(false);setFinding(false);setNotice('');}} onSelect={openBooking} opening={opening} openError={notice}/> }
    {detail&&<BookingDetailsModal isOpen booking={detail} onClose={()=>setDetail(null)} onSave={async saved=>{setDetail(saved);await refresh();}}/>}
    {newBooking&&<AddBookingModal isOpen onClose={()=>setNewBooking(false)} onSuccess={refresh}/>}
  </div>;
}
