'use client';
import {useEffect,useState} from 'react';
import {getAllRooms,InvoiceDraft} from '@/lib/api';
import {Room} from '@/types';
import {control} from '../Extras/ExtraForms';
export default function StayFields({draft,onChange}:{draft:InvoiceDraft;onChange:(value:Partial<InvoiceDraft>)=>void}){
 const [rooms,setRooms]=useState<Room[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);setError('');getAllRooms().then(r=>{if(!Array.isArray(r.rooms))throw Error();setRooms(r.rooms);}).catch(()=>setError('Could not load rooms and beds.')).finally(()=>setLoading(false));};
 useEffect(load,[]);
 const count=Number(draft.guests),valid=Number.isInteger(count)&&count>0&&count<=1000;
 const beds=draft.stay_beds||[];
 const options=rooms.flatMap(room=>room.beds.map(bed=>({bed_id:bed.bed_id,room_name:room.room_name,bed_name:bed.bed_name})));
 return <section className="space-y-4" aria-label="Stay details"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stay details</h3><div className="grid grid-cols-2 gap-3">{(['check_in','check_out'] as const).map(k=><label className="text-xs font-medium text-slate-600" key={k}>{k==='check_in'?'Check-in *':'Check-out *'}<input required className={`${control} mt-1`} type="date" value={draft[k]} onChange={e=>onChange({[k]:e.target.value})}/></label>)}</div><label className="block text-xs font-medium text-slate-600">Guests *<input required type="number" min="1" max="1000" step="1" className={`${control} block mt-1 max-w-32`} value={draft.guests} onChange={e=>{const value=e.target.value,n=Number(value);onChange({guests:value,...(Number.isInteger(n)&&n>0&&n<=1000?{stay_beds:beds.slice(0,n)}:{})});}}/></label>
 {loading&&<p className="text-xs text-slate-500">Loading rooms and beds…</p>}{error&&<p role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={load}>Retry</button></p>}
 {valid&&Array.from({length:count},(_,i)=><label key={i} className="block text-xs font-medium text-slate-600">Room / bed for guest {i+1} *<select required className={`${control} mt-1`} value={beds[i]?.bed_id||''} onChange={e=>{const selected=options.find(b=>b.bed_id===Number(e.target.value));const next=Array.from({length:count},(_,j)=>beds[j]||null);next[i]=selected||null;onChange({stay_beds:next});}}><option value="">Select room / bed</option>{beds[i]&&!options.some(o=>o.bed_id===beds[i]?.bed_id)&&<option value={beds[i]!.bed_id}>{beds[i]!.room_name} / {beds[i]!.bed_name}</option>}{options.map(b=><option key={b.bed_id} value={b.bed_id} disabled={beds.some((chosen,j)=>j!==i&&chosen?.bed_id===b.bed_id)}>{b.room_name} / {b.bed_name}</option>)}</select></label>)}
 </section>;
}
