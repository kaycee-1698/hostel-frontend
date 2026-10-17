'use client';
import CollectPaymentButton from '../Bookings/CollectPaymentButton';
import { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarBookings } from '@/types';
import { dateShade, CalendarDrag, movedStay, visibleMoveConflict } from '@/lib/calendarUtils';
export default function BedRow({ bedId, bedName, dates, today, bookingsByDate, onBookingClick, onEmptyClick,
  onPaymentSaved, disabled, drag, target, allBookings, onBeginMove, onCancelMove, onTarget, onDropMove }: {
  onPaymentSaved?: () => Promise<unknown>;
  bedId: number; bedName: string; dates: Date[]; today: string;
  bookingsByDate: CalendarBookings[number];
  onBookingClick: (id: number) => void; onEmptyClick: (date: Date) => void;
  disabled: boolean; drag: CalendarDrag | null; target: {bedId: number; day: string} | null;
  allBookings: CalendarBookings; onBeginMove: (drag: CalendarDrag) => void;
  onCancelMove: () => void; onTarget: (target: {bedId: number; day: string}) => void;
  onDropMove: (bedId: number, day: string) => void;
}) {
  const suppressClick = useRef(false);
  const pointer = useRef<{id: number; x: number; y: number; started: boolean} | null>(null);
  const destination = (x: number, y: number) => {
    const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-calendar-bed][data-calendar-day]');
    return cell ? { bedId: Number(cell.dataset.calendarBed), day: cell.dataset.calendarDay! } : null;
  };
  const preview = drag && target?.bedId === bedId ? movedStay(drag.assignment, drag.assignment.check_in) : null;
  const conflict = drag && target ? visibleMoveConflict(allBookings, drag, target.bedId, drag.assignment.check_in) : false;
  return <div className="grid border-b border-slate-100" style={{gridTemplateColumns:`200px repeat(${dates.length}, 100px)`}}>
    <div className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">{bedName}</div>
    {dates.map(date => {
      const day = format(date, 'yyyy-MM-dd');
      const booking = bookingsByDate[day];
      const source = drag && booking?.booking_bed_id === drag.assignment.booking_bed_id;
      const inPreview = preview && day >= preview.check_in && day < preview.check_out;
      const description = booking ? `${booking.booking_name} · Check-in ${format(parseISO(booking.check_in), 'dd MMM yyyy')} · Check-out ${format(parseISO(booking.check_out), 'dd MMM yyyy')}` : `Create booking · ${bedName} · ${format(date, 'dd MMM yyyy')}`;
      const chooseTarget = () => { if (drag && !disabled) onTarget({bedId,day}); };
      return <div key={day} className={`group relative border-r border-slate-100 ${dateShade(date, today)}`}>
        <button type="button" disabled={disabled} draggable={false}
          data-calendar-bed={bedId} data-calendar-day={day}
          title={booking ? `${description}. Drag vertically to reassign this bed; dates stay unchanged, or press Space then select a destination.` : description}
          aria-label={drag ? `Move to ${bedName}, ${format(date, 'dd MMM yyyy')} (booking dates unchanged)` : description}
          onPointerDown={event => {
            if (!booking || disabled || drag || event.button !== 0) return;
            pointer.current = {id:event.pointerId, x:event.clientX, y:event.clientY, started:false};
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            const active = pointer.current;
            if (!active || active.id !== event.pointerId || !booking) return;
            if (!active.started && Math.hypot(event.clientX-active.x,event.clientY-active.y) < 6) return;
            event.preventDefault();
            if (!active.started) {
              active.started = true; suppressClick.current = true;
              onBeginMove({assignment:booking,bedId,grabbedDay:day});
            }
            const cell = destination(event.clientX,event.clientY);
            if (cell) onTarget(cell);
          }}
          onPointerUp={event => {
            const active = pointer.current;
            pointer.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            if (!active?.started) return;
            event.preventDefault();
            const cell = destination(event.clientX,event.clientY);
            if (cell) onDropMove(cell.bedId,cell.day); else onCancelMove();
            setTimeout(() => { suppressClick.current = false; }, 400);
          }}
          onPointerCancel={() => {
            pointer.current = null; onCancelMove();
            setTimeout(() => { suppressClick.current = false; }, 400);
          }}
          onFocus={chooseTarget} onMouseEnter={chooseTarget}
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); onCancelMove(); }
            if (event.key === ' ' && booking && !drag && !disabled) {
              event.preventDefault(); onBeginMove({assignment: booking, bedId, grabbedDay: day});
            }
          }}
          onClick={() => {
            if (suppressClick.current || disabled) return;
            if (drag) { onDropMove(bedId,day); return; }
            booking ? onBookingClick(booking.booking_id) : onEmptyClick(date);
          }}
          className={`h-full min-h-11 w-full select-none ${booking ? 'touch-none' : ''} truncate px-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-wait ${inPreview ? (conflict ? 'bg-red-200 ring-1 ring-inset ring-red-400' : 'bg-indigo-200 ring-1 ring-inset ring-indigo-400') : booking ? 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200 cursor-grab active:cursor-grabbing' : 'text-slate-400 hover:bg-indigo-100'} ${source ? 'opacity-50' : ''}`}>
          {booking ? booking.booking_name : <span aria-hidden="true" className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">{drag ? 'Move here' : '+ Book'}</span>}
        </button>
        {booking && !drag && !disabled && onPaymentSaved && <div className="absolute bottom-0 right-0"><CollectPaymentButton id={booking.booking_id} name={booking.booking_name} pending={booking.pending_amount??0} onSaved={onPaymentSaved}/></div>}
        {booking && !drag && <div role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-40 hidden w-64 rounded bg-slate-900 p-2 text-xs text-white shadow-lg group-hover:block group-focus-within:block">{description}<br />Drag vertically to change beds · Space to choose</div>}
      </div>;
    })}
  </div>;
}
