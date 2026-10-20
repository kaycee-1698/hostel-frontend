'use client';
import {useEffect,useState} from 'react';
import {getActivityLogs,ActivityLog,ActivityLogResponse} from '@/lib/api';
import {hostelToday} from '@/lib/bookingFilters';

const actions:Record<string,string>={create:'Created',update:'Updated / Edited',delete:'Deleted',assign:'Assigned',reassign:'Reassigned / Changed stay',unassign:'Unassigned',rate_change:'Rate changed'};
const categories:Record<string,string>={booking:'Bookings',room:'Rooms',bed:'Beds',bed_assignment:'Bed assignments',room_assignment:'Room assignments',rate:'Nightly rates',guest:'Guests',payment:'Payments',document:'Guest documents',extra_item:'Extra items',extra_sale:'Extras payments',invoice:'Invoices'};
type Filters={period:string;start:string;end:string;search:string;action:string;entity:string};
const initialFilters=():Filters=>({period:'today',start:hostelToday(),end:hostelToday(),search:'',action:'',entity:''});
const control='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-indigo-600';
const button='rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40';
const time=(value:string)=>new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(value));
const label=(key:string)=>({check_in:'Check-in',check_out:'Check-out',payment_received:'Paid amount',base_amount:'Base amount',base_rate:'Base rate',rate:'Nightly rate',stay_date:'Night',number_of_adults:'Adults',imageURL:'Document',id_number:'Identity document',gst:'GST'}[key]??key.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase()));
const value=(row:Record<string,unknown>|null,key:string)=>row===null?'—':!Object.hasOwn(row,key)?'Not stored':row[key]===null?'—':String(row[key]);
function Changes({log}:{log:ActivityLog}){
 const fields=log.before_values&&log.after_values?log.changed_fields:Object.keys(log.after_values??log.before_values??{});
 return <details className="mt-2"><summary className="cursor-pointer text-xs text-indigo-600">View details</summary><div className="mt-2 overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-slate-500"><th className="p-2 text-left font-medium">Field</th><th className="p-2 text-left font-medium">Before</th><th className="p-2 text-left font-medium">After</th></tr></thead><tbody>{fields.map(key=><tr key={key} className="border-t border-slate-100"><th className="p-2 text-left font-normal">{label(key)}</th><td className="p-2 break-words">{value(log.before_values,key)}</td><td className="p-2 break-words">{value(log.after_values,key)}</td></tr>)}</tbody></table></div></details>;
}
export default function ActivityLogs(){
 const [draft,setDraft]=useState<Filters>(initialFilters);
 const [filters,setFilters]=useState<Filters>(initialFilters);
 const [page,setPage]=useState(1);
 const [revision,setRevision]=useState(0);
 const [data,setData]=useState<ActivityLogResponse|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [validation,setValidation]=useState('');
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  setLoading(true);setError('');setData(null);
  getActivityLogs({...filters,page:String(page)},controller.signal).then(result=>{if(active)setData(result);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'Could not load activity logs.');}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;controller.abort();};
 },[filters,page,revision]);
 const change=(key:keyof Filters,value:string)=>{setDraft(previous=>({...previous,[key]:value}));setValidation('');};
 const apply=(next:Filters)=>{setValidation('');setFilters({...next});setPage(1);};
 return <div className="space-y-5 text-slate-900">
  <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold">Activity logs</h2><p className="mt-1 text-sm text-slate-500">{filters.period==='today'?'Showing today’s activity. All history is retained.':'All history is retained.'}</p></div><button className={button} disabled={loading} onClick={()=>setRevision(value=>value+1)}>Refresh</button></header>
  <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={event=>{event.preventDefault();if(draft.period==='custom'&&(!draft.start||!draft.end||draft.start>draft.end)){setValidation('Choose an end date on or after the start date.');return;}apply(draft);}}>
   <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">Search<input className={control} placeholder="Booking name, room or record #" maxLength={100} value={draft.search} onChange={event=>change('search',event.target.value)}/></label>
   <label className="flex flex-col gap-1 text-sm">Date range<select className={control} value={draft.period} onChange={event=>change('period',event.target.value)}><option value="today">Today</option><option value="custom">Custom dates</option><option value="all">All dates</option></select></label>
   {draft.period==='custom'&&<><label className="flex flex-col gap-1 text-sm">From<input type="date" required className={control} value={draft.start} onChange={event=>change('start',event.target.value)}/></label><label className="flex flex-col gap-1 text-sm">To<input type="date" required className={control} min={draft.start} value={draft.end} onChange={event=>change('end',event.target.value)}/></label></>}
   <label className="flex flex-col gap-1 text-sm">Category<select className={control} value={draft.entity} onChange={event=>change('entity',event.target.value)}><option value="">All categories</option>{Object.entries(categories).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
   <label className="flex flex-col gap-1 text-sm">Action<select className={control} value={draft.action} onChange={event=>change('action',event.target.value)}><option value="">All actions</option>{Object.entries(actions).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
   <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Apply</button>
   <button type="button" className={button} onClick={()=>{const next={...initialFilters(),period:'all'};setDraft(next);apply(next);}}>Clear filters / View all</button>
   {validation&&<p role="alert" className="w-full text-sm text-red-700">{validation}</p>}
  </form>
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} <button className="underline" onClick={()=>setRevision(value=>value+1)}>Retry</button></p>}
  {loading&&<p role="status" className="py-6 text-center text-sm text-slate-500">Loading activity…</p>}
  {data&&<>
   <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{data.total.toLocaleString('en-IN')} {data.total===1?'entry':'entries'}</span><span>Newest first · Times in IST</span></div>
   <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Date & time','Action','Category','Activity','User','Role'].map(heading=><th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.logs.map(log=><tr key={log.log_id} className="align-top"><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{time(log.occurred_at)}</td><td className="px-4 py-3"><span className={`whitespace-nowrap rounded px-2 py-1 text-xs ${log.action==='delete'||log.action==='unassign'?'bg-red-50 text-red-700':'bg-indigo-50 text-indigo-700'}`}>{actions[log.action]??log.action}</span></td><td className="px-4 py-3 text-slate-500">{categories[log.entity_type]??log.entity_type}</td><td className="min-w-72 max-w-xl px-4 py-3"><p className="break-words">{log.summary}</p><Changes log={log}/></td><td className="px-4 py-3">{log.actor_name}</td><td className="px-4 py-3">{log.actor_role}</td></tr>)}</tbody></table>{!data.logs.length&&<p className="p-8 text-center text-sm text-slate-500">No activity matches these filters.</p>}</div>
   <div className="flex items-center justify-end gap-3 text-sm"><button className={button} disabled={page<=1} onClick={()=>setPage(value=>value-1)}>Previous</button><span>Page {page} of {Math.max(page,Math.ceil(data.total/data.pageSize))}</span><button className={button} disabled={page*data.pageSize>=data.total} onClick={()=>setPage(value=>value+1)}>Next</button></div>
  </>}
 </div>;
}
