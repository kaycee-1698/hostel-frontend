'use client';
import {useEffect,useRef,useState} from 'react';
import {Booking} from '@/types';
import {collectBookingPayment,getBookingById} from '@/lib/api';
const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value);
type Props={id:number;name:string;pending:number;onSaved:(booking:Booking)=>void|Promise<unknown>;alwaysVisible?:boolean};
export default function CollectPaymentButton({id,name,pending,onSaved,alwaysVisible=false}:Props){
 const [open,setOpen]=useState(false),[unconfirmed,setUnconfirmed]=useState(false);
 useEffect(()=>{try{setUnconfirmed(!!sessionStorage.getItem(`collect-payment:${id}`));}catch{}},[id,pending,open]);
 if(!(Number(pending)>0)&&!open&&!unconfirmed)return null;
 return <span onClick={event=>event.stopPropagation()} onPointerDown={event=>event.stopPropagation()} className="inline-flex">
  <button type="button" aria-label={`Collect payment for ${name}`} onClick={()=>setOpen(true)} className={`whitespace-nowrap rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 ${alwaysVisible?'':'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'}`}>{unconfirmed?'Confirm payment':'Collect payment'}</button>
  {open&&<PaymentPopup id={id} name={name} onSaved={onSaved} onClose={()=>setOpen(false)}/>}
 </span>;
}
function PaymentPopup({id,name,onSaved,onClose}:Omit<Props,'pending'|'alwaysVisible'>&{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),saving=useRef(false);
 const [booking,setBooking]=useState<Booking|null>(null),[amount,setAmount]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 const [pending,setPending]=useState<{amount:number;request_id:string}|null>(null);
 const key=`collect-payment:${id}`;
 useEffect(()=>{const element=dialog.current,previous=document.activeElement as HTMLElement|null;element?.showModal();return()=>{element?.close();previous?.focus();};},[]);
 useEffect(()=>{let active=true;setLoading(true);setError('');getBookingById(id).then(result=>{if(!active)return;setBooking(result);try{const stored=sessionStorage.getItem(key);if(stored){const request=JSON.parse(stored);setPending(request);setAmount(String(request.amount));}}catch{setError('Could not restore a pending payment. Please reload this page.');}}).catch(()=>{if(active)setError('Could not load the current balance. Please retry.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id,key,retry]);
 useEffect(()=>{if(booking&&!loading)input.current?.focus();},[booking,loading]);
 const balance=Number(booking?.pending_amount??0),entered=Number(amount);
 const save=async()=>{
  if(saving.current||done||!booking)return;
  if(!pending&&(!/^\d+(\.\d{1,2})?$/.test(amount)||entered<=0||entered>balance||entered>1000000)){setError('Enter an amount greater than zero and no more than the balance due.');return;}
  const request=pending??{amount:entered,request_id:crypto.randomUUID()};
  try{sessionStorage.setItem(key,JSON.stringify(request));}catch{setError('Could not prepare the payment. Allow browser storage and try again.');return;}
  saving.current=true;setBusy(true);setPending(request);setError('');
  try{
   const saved=await collectBookingPayment(id,request.amount,request.request_id);
   setDone(true);setBooking(saved);setPending(null);try{sessionStorage.removeItem(key);}catch{/* The saved request remains safe to retry. */}
   try{await onSaved(saved);}catch{setError('Payment saved. Refresh the page to update the booking list.');}
  }catch(cause){
   const failure=cause as Error&{definitive?:boolean};setError(failure.message);
   if(failure.definitive){try{sessionStorage.removeItem(key);}catch{}setPending(null);getBookingById(id).then(setBooking).catch(()=>{});}
  }finally{saving.current=false;setBusy(false);}
 };
 const close=()=>{if(!saving.current)onClose();};
 return <dialog ref={dialog} onKeyDown={event=>event.stopPropagation()} onClick={event=>event.stopPropagation()} onCancel={event=>{event.preventDefault();close();}} aria-labelledby={`payment-title-${id}`} className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-5 text-left font-normal text-slate-900 shadow-xl backdrop:bg-black/50">
  <h2 id={`payment-title-${id}`} className="text-lg font-semibold">{done?'Payment recorded':'Collect payment'}</h2><p className="mt-1 text-sm text-slate-500">{name}</p>
  {loading?<p className="mt-4 text-sm" role="status">Loading balance…</p>:<>
   <p className="my-4 flex justify-between gap-3 text-sm">{done?'Remaining balance':'Balance due'} <strong >{money(balance)}</strong></p>
   {!done&&booking&&<form onSubmit={event=>{event.preventDefault();void save();}}>
    <label className="block text-sm">Amount received (₹)<input ref={input} type="number" step="0.01" min="0.01" max={balance} disabled={busy||!!pending} value={amount} onChange={event=>{setAmount(event.target.value);setError('');}} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-indigo-600" /></label>
    {!pending&&<p className="mt-2 text-xs text-slate-500">Remaining after payment: {money(Math.max(0,balance-(Number.isFinite(entered)?entered:0)))}</p>}
    {pending&&!busy&&<p className="mt-2 text-xs text-amber-700">This payment needs confirmation. Retry to check it safely without recording it twice.</p>}
    <button disabled={busy||(!pending&&balance<=0)} className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">{busy?'Saving…':pending?'Retry payment':'Save payment'}</button>
   </form>}
   {done&&<p role="status" className="text-sm text-emerald-700">Payment saved successfully.</p>}
  </>}
  {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}{!booking&&<button onClick={()=>setRetry(v=>v+1)} className="ml-2 underline">Retry</button>}</p>}
  <button type="button" disabled={busy} onClick={close} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">{done?'Done':'Cancel'}</button>
 </dialog>;
}
