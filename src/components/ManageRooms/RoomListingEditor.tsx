'use client';
import {useRef,useState} from 'react';
import {Room} from '@/types';
import {updateRoom,uploadRoomPhoto,saveRoomPhotos} from '@/lib/api';

type Photo={path:string;url:string};
export default function RoomListingEditor({room,onRefresh}:{room:Room;onRefresh:()=>Promise<void>}){
 const [type,setType]=useState(room.room_type||'dormitory');
 const [description,setDescription]=useState(room.description||'');
 const [rate,setRate]=useState(String(room.base_rate??600));
 const [photos,setPhotos]=useState<Photo[]>(room.photos||[]);
 const [savedPaths,setSavedPaths]=useState<string[]>(room.photo_paths||[]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const lock=useRef(false),fileInput=useRef<HTMLInputElement>(null);
 const dirty=JSON.stringify(photos.map(p=>p.path))!==JSON.stringify(savedPaths);
 async function run(action:()=>Promise<void>){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setSuccess('');
  try{await action();}catch(e){setError(e instanceof Error?e.message:'Could not save changes. Try again.');}
  finally{lock.current=false;setBusy(false);}
 }
 function move(index:number,offset:number){setPhotos(old=>{const next=[...old];[next[index],next[index+offset]]=[next[index+offset],next[index]];return next;});setSuccess('');}
 async function upload(files:File[]){
  if(dirty){setError('Save or cancel your photo order before uploading more photos.');return;}
  if(files.length+photos.length>12){setError('Choose up to 12 photos per room.');return;}
  if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024)){setError('Choose JPG, PNG or WebP photos up to 5 MB each.');return;}
  await run(async()=>{
   let count=0;
   try{for(const file of files){
    const value=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read photo.'));reader.readAsDataURL(file);});
    const result=await uploadRoomPhoto(room.room_id,value);
    setPhotos(result.room.photos);setSavedPaths(result.room.photo_paths);count++;
   }setSuccess(`${count} photo${count===1?'':'s'} uploaded.`);}
   catch(e){throw new Error(`${count?`${count} photo(s) saved. `:''}${e instanceof Error?e.message:'Upload failed.'}`);}
   finally{await onRefresh();if(fileInput.current)fileInput.current.value='';}
  });
 }
 return <div className="mt-4 border-t border-gray-200 pt-5 space-y-6">
  <form className="space-y-4" onSubmit={e=>{e.preventDefault();void run(async()=>{
   if(!/^\d+(\.\d{1,2})?$/.test(rate)||Number(rate)>1000000)throw new Error('Enter a valid base rate between ₹0 and ₹10,00,000.');
   await updateRoom(room.room_id,{room_type:type,description,base_rate:Number(rate)});await onRefresh();setSuccess('Room details saved.');
  });}}>
   <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Room type<select disabled={busy} className="mt-1 w-full rounded border p-2" value={type} onChange={e=>setType(e.target.value as 'private'|'dormitory')}><option value="dormitory">Dormitory</option><option value="private">Private room</option></select></label>
   <label className="block text-sm font-medium">Base rate (₹ per {type==='private'?'room':'bed'} / night)<input disabled={busy} required min="0" max="1000000" step="0.01" type="number" className="mt-1 w-full rounded border p-2" value={rate} onChange={e=>setRate(e.target.value)}/></label></div>
   <label className="block text-sm font-medium">Guest-facing description<textarea disabled={busy} maxLength={3000} rows={3} className="mt-1 w-full rounded border p-3" placeholder="Tell guests about this room, its facilities and what makes it special." value={description} onChange={e=>setDescription(e.target.value)}/></label>
   <button disabled={busy} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">Save room details</button>
  </form>
  <div><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-medium">Room photos</h3><p className="text-sm text-gray-500">First photo is the cover. Up to 12 photos · JPG, PNG or WebP · 5 MB each.</p></div><label className={`rounded border px-3 py-2 text-sm ${busy||dirty?'opacity-50':'cursor-pointer'}`}>Upload photos<input ref={fileInput} aria-label="Upload room photos" disabled={busy||dirty} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>{if(e.target.files?.length)void upload(Array.from(e.target.files));}}/></label></div>
   {!photos.length&&<p className="my-4 rounded bg-gray-50 p-5 text-sm text-gray-500">No photos yet. Upload a photo to introduce this room to guests.</p>}
   <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo,index)=><div key={photo.path} className="overflow-hidden rounded-lg border"><div className="relative"><img className="h-32 w-full object-cover" src={photo.url} alt={`${room.room_name}, photo ${index+1}`}/>{index===0&&<span className="absolute left-2 top-2 rounded bg-white px-2 py-1 text-xs font-medium">Cover</span>}</div><div className="flex items-center justify-between gap-1 p-2"><div className="flex gap-1"><button aria-label={`Move photo ${index+1} earlier`} disabled={busy||index===0} onClick={()=>move(index,-1)} className="rounded border px-2 py-1 disabled:opacity-30">←</button><button aria-label={`Move photo ${index+1} later`} disabled={busy||index===photos.length-1} onClick={()=>move(index,1)} className="rounded border px-2 py-1 disabled:opacity-30">→</button></div><button disabled={busy} onClick={()=>setPhotos(old=>old.filter(p=>p.path!==photo.path))} className="text-xs text-red-700">Remove</button></div></div>)}</div>
   {dirty&&<div className="mt-4 flex gap-3"><button disabled={busy} onClick={()=>void run(async()=>{const result=await saveRoomPhotos(room.room_id,savedPaths,photos.map(p=>p.path));setPhotos(result.room.photos);setSavedPaths(result.room.photo_paths);await onRefresh();setSuccess('Photos saved.');})} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">Save photo changes</button><button disabled={busy} onClick={()=>setPhotos((room.photos||[]).filter(p=>savedPaths.includes(p.path)))} className="text-sm">Cancel</button></div>}
  </div>
  {busy&&<p role="status" className="text-sm text-gray-600">Saving…</p>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{success&&<p role="status" className="text-sm text-green-700">{success}</p>}
 </div>;
}
