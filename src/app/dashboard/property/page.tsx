'use client';

import { useEffect, useRef, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API}${path}`, { ...options, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not complete this request. Please try again.');
  return data;
}
const amenityGroups = {
  'Essentials': ['Wi-Fi', 'Air conditioning', 'Hot water', 'Linen included', 'Lockers', 'Towels'],
  'Shared spaces': ['Rooftop', 'Lounge', 'Shared kitchen', 'Dining area', 'Garden', 'Workspace'],
  'Services & activities': ['Luggage storage', 'Laundry', 'Board games', 'Events', 'Parking', '24-hour reception'],
};
type Photo = { id: string; src: string; caption: string; path?: string };
const initial = {
  name: 'Unpack Hostel', description: '', address: 'No. 96, Saint Rosario Street, Muthialpet',
  city: 'Puducherry', postcode: '605003', country: 'India', phone: '+91 8169791517',
  email: 'unpackhostels@gmail.com', directions: 'https://maps.app.goo.gl/b2tjgC1A1HGPNGRL8',
  checkIn: '13:00', checkOut: '10:00', amenities: ['Wi-Fi', 'Air conditioning', 'Hot water', 'Linen included', 'Rooftop', 'Lounge', 'Shared kitchen', 'Luggage storage', 'Board games'],
  customAmenities: [] as string[], photos: [] as Photo[],
};
type Details = typeof initial;
const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const secondary = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40';

// Resize images before uploading to keep public property photos lightweight.
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Photo preview could not be created.');
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not open ${file.name}. Choose a JPG, PNG or WebP image.`)); };
    image.src = url;
  });
}

export default function PropertyDetailsPage() {
  const [details, setDetails] = useState<Details>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [version, setVersion] = useState(1);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [custom, setCustom] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(details) !== saved;

  async function load() {
    setReady(false); setError('');
    try {
      const data = await request('/property');
      const value = { ...data.details, photos: data.details.photos.map((p: {path: string; url: string; caption: string}) => ({ id: p.path, path: p.path, src: p.url, caption: p.caption })) };
      setDetails(value); setSaved(JSON.stringify(value)); setVersion(data.version); setReady(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load property details.'); }
  }
  useEffect(() => { void load(); }, []);
  async function save() {
    if (busy || !ready) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      const photos: Photo[] = [];
      for (const photo of details.photos) {
        if (photo.path) { photos.push(photo); continue; }
        const uploaded = await request('/property/photos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({photo: photo.src}) });
        const next = { ...photo, path: uploaded.path, src: uploaded.url };
        photos.push(next);
        // Retain completed uploads if a later upload or save fails.
        setDetails(current => ({...current, photos: current.photos.map(p => p.id === photo.id ? next : p)}));
      }
      const result = await request('/property', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({version, details: {...details, photos: photos.map(p => ({path:p.path, caption:p.caption}))}}) });
      const value = {...details, photos};
      setDetails(value); setSaved(JSON.stringify(value)); setVersion(result.version);
      setSuccess('Property details saved. Changes are now available on the guest website.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save. Your edits are still here.'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function update<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails(current => ({ ...current, [key]: value })); setSuccess('');
  }
  async function addPhotos(files: File[]) {
    setError(''); setBusy(true);
    try {
      if (details.photos.length + files.length > 12) throw new Error('You can add up to 12 property photos.');
      if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) throw new Error('Choose JPG, PNG or WebP images, up to 5 MB each.');
      const photos = await Promise.all(files.map(async file => ({ id: crypto.randomUUID(), src: await readPhoto(file), caption: '' })));
      setDetails(current => ({ ...current, photos: [...current.photos, ...photos] })); setSuccess('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add photos. Please try again.'); }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  }
  function movePhoto(index: number, destination: number) {
    const photos = [...details.photos]; const [photo] = photos.splice(index, 1); photos.splice(destination, 0, photo); update('photos', photos);
  }
  function addAmenity() {
    const name = custom.trim();
    if (!name) return;
    const existing = [...Object.values(amenityGroups).flat(), ...details.customAmenities].find(a => a.toLowerCase() === name.toLowerCase());
    const value = existing || name;
    setDetails(current => ({ ...current, customAmenities: existing ? current.customAmenities : [...current.customAmenities, value], amenities: current.amenities.includes(value) ? current.amenities : [...current.amenities, value] }));
    setCustom(''); setSuccess('');
  }
  function field(label: string, key: keyof Omit<Details, 'photos' | 'amenities' | 'customAmenities'>, type = 'text', required = false) {
    return <label className="block text-sm font-medium text-slate-700">{label}{required && ' *'}<input className={inputClass} type={type} required={required} value={details[key]} onChange={e => update(key, e.target.value)} /></label>;
  }

  return <form className="mx-auto max-w-5xl space-y-6 text-slate-900" onSubmit={e => { e.preventDefault(); void save(); }}>
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">Property</p><h1 className="text-2xl font-bold">Property details</h1><p className="mt-1 text-sm text-slate-500">Manage the information guests will see about your hostel.</p></div>
      <button disabled={!ready || busy || !dirty} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40" type="submit">Save changes</button>
    </header>
    <p className="text-sm text-slate-500">Saved changes appear on your guest website. Photos are public.</p>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} <button type="button" className="underline" disabled={busy} onClick={() => { if (!dirty || window.confirm('Reload saved details and discard your unsaved edits?')) void load(); }}>Reload saved details</button></p>}
    {success && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
    <fieldset disabled={!ready || busy} className="space-y-6 disabled:opacity-60">
      <section className="rounded-xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">About the property</h2><p className="mb-5 mt-1 text-sm text-slate-500">A name and introduction for your guest website.</p>
        {field('Property name', 'name', 'text', true)}
        <label className="mt-4 block text-sm font-medium text-slate-700">About the hostel<textarea rows={4} maxLength={3000} className={inputClass} value={details.description} placeholder="Tell guests about your hostel, its atmosphere and location." onChange={e => update('description', e.target.value)} /></label>
      </section>
      <section className="rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Property photos <span className="ml-2 text-sm font-normal text-slate-400">{details.photos.length}/12</span></h2><p className="mt-1 text-sm text-slate-500">Common areas, rooftop, entrance and surroundings. The first photo is the cover.</p></div><button type="button" disabled={details.photos.length >= 12} className={secondary} onClick={() => fileInput.current?.click()}>+ Add photos</button></div>
        <input ref={fileInput} type="file" className="sr-only" aria-label="Choose property photos" accept="image/jpeg,image/png,image/webp" multiple onChange={e => void addPhotos(Array.from(e.target.files || []))} />
        {!details.photos.length && <button type="button" onClick={() => fileInput.current?.click()} className="mt-5 flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm hover:border-indigo-400"><span className="text-3xl text-indigo-400" aria-hidden="true">▧</span><span className="font-medium">Add your property photos</span><span className="text-xs text-slate-500">JPG, PNG or WebP · Up to 5 MB each</span></button>}
        {busy && <p role="status" className="mt-3 text-sm text-indigo-600">Preparing changes…</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{details.photos.map((photo, index) => <article key={photo.id} className="overflow-hidden rounded-lg border border-slate-200">
          <div className="relative"><img src={photo.src} alt={photo.caption || `Property photo ${index + 1}`} className="aspect-[4/3] w-full object-cover" />{index === 0 && <span className="absolute top-2 left-2 rounded bg-white px-2 py-1 text-xs font-semibold">Cover photo</span>}</div>
          <div className="p-3"><label className="text-xs text-slate-600">Photo description<input value={photo.caption} maxLength={160} placeholder="e.g. Rooftop seating" className={inputClass} onChange={e => update('photos', details.photos.map(p => p.id === photo.id ? { ...p, caption: e.target.value } : p))} /></label>
          <div className="mt-3 flex items-center gap-2"><button type="button" className={secondary} disabled={index === 0} aria-label={`Move photo ${index + 1} earlier`} onClick={() => movePhoto(index, index - 1)}>←</button><button type="button" className={secondary} disabled={index === details.photos.length - 1} aria-label={`Move photo ${index + 1} later`} onClick={() => movePhoto(index, index + 1)}>→</button><button type="button" className="ml-auto text-sm text-red-600 hover:underline" onClick={() => update('photos', details.photos.filter(p => p.id !== photo.id))}>Remove</button></div></div>
        </article>)}</div>
        <p className="mt-3 text-xs text-slate-500">Room photos are managed separately in Manage Rooms.</p>
      </section>
      <section className="rounded-xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Amenities</h2><p className="mt-1 text-sm text-slate-500">Select what is available at your property.</p>
        <div className="mt-5 grid gap-6 md:grid-cols-3">{Object.entries({ ...amenityGroups, ...(details.customAmenities.length ? { 'Other amenities': details.customAmenities } : {}) }).map(([group, amenities]) => <div key={group}><h3 className="mb-3 text-sm font-semibold">{group}</h3><div className="space-y-3">{amenities.map(amenity => <label key={amenity} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={details.amenities.includes(amenity)} onChange={e => update('amenities', e.target.checked ? [...details.amenities, amenity] : details.amenities.filter(a => a !== amenity))} />{amenity}</label>)}</div></div>)}</div>
        <div className="mt-6 border-t border-slate-100 pt-4"><label htmlFor="custom-amenity" className="text-sm font-medium">Add another amenity</label><div className="mt-1 flex max-w-md gap-2"><input id="custom-amenity" className={inputClass + ' mt-0'} maxLength={60} value={custom} placeholder="e.g. Bicycle rental" onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }} /><button type="button" className={secondary} disabled={!custom.trim()} onClick={addAmenity}>Add</button></div></div>
      </section>
      <section className="rounded-xl border border-slate-200 p-5 sm:p-6"><h2 className="mb-5 text-lg font-semibold">Location & contact</h2>{field('Street address', 'address')}<div className="mt-4 grid gap-4 sm:grid-cols-3">{field('City', 'city')}{field('Postal code', 'postcode')}{field('Country', 'country')}</div><div className="mt-4 grid gap-4 sm:grid-cols-2">{field('Phone / WhatsApp', 'phone', 'tel')}{field('Email', 'email', 'email')}</div><div className="mt-4">{field('Google Maps link', 'directions', 'url')}</div></section>
      <section className="rounded-xl border border-slate-200 p-5 sm:p-6"><h2 className="mb-5 text-lg font-semibold">Check-in & check-out</h2><div className="grid max-w-xl gap-4 sm:grid-cols-2">{field('Check-in from', 'checkIn', 'time', true)}{field('Check-out by', 'checkOut', 'time', true)}</div></section>
    </fieldset>
    <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white py-4"><span className="text-sm text-slate-500">{dirty ? 'Unsaved changes' : 'No unsaved changes'}</span><div className="flex gap-3"><button type="button" className={secondary} disabled={!dirty || busy} onClick={() => { if (window.confirm('Discard your unsaved property changes?')) { setDetails(JSON.parse(saved)); setError(''); setSuccess(''); } }}>Discard changes</button><button type="submit" disabled={!ready || busy || !dirty} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">Save changes</button></div></footer>
  </form>;
}
