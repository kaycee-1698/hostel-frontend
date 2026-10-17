'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {getDashboard} from '@/lib/api';
export type DashboardStay={id:number;name:string;guests:number;room:string;balance:number;check_in:string;check_out:string};
export type DashboardData={today:string;rooms:{id:number;name:string;rate:number;total:number;free:number}[];arrivals:DashboardStay[];departures:DashboardStay[];total:number;occupied:number;available:number;occupancy:number;monthly:{sales:number;received:number;outstanding:number;undatedCount:number};week:{date:string;free:number}[];demoBookings:number};
export function useDashboard(){
 const [data,setData]=useState<DashboardData|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const version=useRef(0);
 const refresh=useCallback(async()=>{const request=++version.current;setLoading(true);setError('');try{const result=await getDashboard();if(request===version.current)setData(result);}catch{if(request===version.current)setError('Could not load the dashboard. Please retry.');}finally{if(request===version.current)setLoading(false);}},[]);
 useEffect(()=>{void refresh();const update=()=>{void refresh();};const timer=setInterval(update,60000);window.addEventListener('focus',update);return()=>{++version.current;clearInterval(timer);window.removeEventListener('focus',update);};},[refresh]);
 return {data,error,loading,refresh};
}
