'use client';
import {getCountries,getCountryCallingCode,parsePhoneNumberFromString,CountryCode} from 'libphonenumber-js/max';
import {InvoiceDraft} from '@/lib/api';
import {control} from '../Extras/ExtraForms';
const countries=getCountries();
const names=new Intl.DisplayNames(['en'],{type:'region'});
export default function PhoneField({draft,onChange}:{draft:InvoiceDraft;onChange:(value:Partial<InvoiceDraft>)=>void}){
 const parsed=parsePhoneNumberFromString(draft.customer_phone||'','IN');
 const country=(draft.phone_country||parsed?.country||'IN') as CountryCode;
 const national=draft.phone_national??(parsed?.nationalNumber||draft.customer_phone?.replace(/\D/g,'')||'');
 const update=(region:CountryCode,value:string)=>{
  onChange({phone_country:region,phone_national:value,customer_phone:value?`+${getCountryCallingCode(region)}${value}`:''});
 };
 return <div><span className="text-xs font-medium text-slate-600">Phone</span><div className="mt-1 grid grid-cols-[minmax(110px,0.85fr)_minmax(120px,1.15fr)] gap-2"><label><span className="sr-only">Phone country code</span><select className={control} value={country} onChange={e=>update(e.target.value as CountryCode,national)}>{countries.map(c=><option key={c} value={c}>{c} (+{getCountryCallingCode(c)}) — {names.of(c)}</option>)}</select></label><label><span className="sr-only">Phone number</span><input className={control} type="tel" inputMode="numeric" pattern="[0-9]+" value={national} placeholder="Phone number" onChange={e=>{const value=e.target.value.replace(/\D/g,'');update(country,value);}}/></label></div></div>;
}
