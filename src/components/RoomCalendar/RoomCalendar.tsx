'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import CalendarHeader from './CalendarHeader';
import DateRangeSelector from './DateRangeSelector';
import BedRow from './BedRow';
import AddBookingModal from '../Bookings/AddBookingModal';
import BookingDetailsModal from '../Bookings/BookingDetailsModal';
import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';
import { hostelToday } from '@/lib/bookingFilters';
import { defaultCalendarRange, freeBeds, dateShade, movedStay, bedSwapCandidate, CalendarDrag } from '@/lib/calendarUtils';
import { moveCalendarAssignment } from '@/lib/api';
import Modal from '../Modal/Modal';
import { Booking, Bed, Room, CalendarAssignment } from '@/types';

const control = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-indigo-600';
export default function RoomCalendar() {
  const [today, setToday] = useState(hostelToday());
  const [range, setRange] = useState(() => defaultCalendarRange(hostelToday()));
  const [expandedRooms, setExpandedRooms] = useState<Record<number, boolean>>({});
  const [drag, setDrag] = useState<CalendarDrag | null>(null);
  const dragRef = useRef<CalendarDrag | null>(null);
  const [target, setTarget] = useState<{bedId: number; day: string} | null>(null);
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);
  const [moveMessage, setMoveMessage] = useState('');
  const [moveError, setMoveError] = useState('');
  type BedChange = { source: CalendarDrag; bedId: number; swap?: CalendarAssignment; isUndo?: boolean };
  const [undoMove, setUndoMove] = useState<BedChange | null>(null);
  const [pendingSwap, setPendingSwap] = useState<BedChange | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [draft, setDraft] = useState<{data: Partial<Booking>} | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailError, setDetailError] = useState('');
  const [opening, setOpening] = useState(false);
  const detailRequest = useRef(0);
  const { rooms, loading: roomsLoading, error: roomsError, fetchRooms } = useRooms();
  const { getBedsAndRoomsForBooking } = useBookings();
  const { calendarBookings, loading, error, fetchCalendarBookings } = useCalendarBookings(range.start, range.end);
  useEffect(() => {
    const update = () => setToday(hostelToday());
    const timer = setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); ++detailRequest.current; };
  }, []);
  const [noticePaused, setNoticePaused] = useState(false);
  useEffect(() => {
    if ((!moveMessage && !undoMove) || moving || drag || pendingSwap || noticePaused) return;
    const timer = setTimeout(() => { setMoveMessage(''); setUndoMove(null); }, undoMove ? 10000 : 5000);
    return () => clearTimeout(timer);
  }, [moveMessage, undoMove, moving, drag, pendingSwap, noticePaused]);
  const dates = useMemo(() => eachDayOfInterval(range), [range]);
  const visibleRooms = rooms;
  const targetRoom = target ? rooms.find(room => room.beds.some(bed => bed.bed_id === target.bedId)) : undefined;
  const targetBed = targetRoom?.beds.find(bed => bed.bed_id === target?.bedId);
  const grid = { gridTemplateColumns: `200px repeat(${dates.length}, 100px)` };
  const busy = loading || roomsLoading;
  const failure = error || roomsError;
  const refresh = async () => { await Promise.all([fetchCalendarBookings(), fetchRooms()]); };
  const cancelMove = () => { dragRef.current = null; setDrag(null); setTarget(null); };
  const beginMove = (value: CalendarDrag) => {
    if (movingRef.current) return;
    dragRef.current = value; setDrag(value); setTarget(null); setMoveMessage(''); setMoveError('');
  };
  const performBedChange = async (change: BedChange) => {
    if (movingRef.current) return;
    const {source, bedId, swap, isUndo} = change;
    movingRef.current = true; setMoving(true); setUndoing(!!isUndo); cancelMove(); setPendingSwap(null); setMoveError(''); setMoveMessage('');
    try {
      await moveCalendarAssignment(source.assignment.booking_bed_id, {
        bed_id: bedId, check_in: source.assignment.check_in, expected_bed_id: source.bedId,
        expected_check_in: source.assignment.check_in, expected_check_out: source.assignment.check_out,
        ...(swap ? {swap_assignment_id:swap.booking_bed_id,swap_check_in:swap.check_in,swap_check_out:swap.check_out,confirm_swap:true} : {}),
      });
      setUndoMove(isUndo ? null : change);
      setMoveMessage(isUndo ? 'Original bed assignments restored. Booking dates are unchanged.' :
        swap ? `${source.assignment.booking_name} and ${swap.booking_name}: beds exchanged. Booking dates are unchanged.` :
        `${source.assignment.booking_name}: bed reassigned. Booking dates are unchanged.`);
    } catch (error) {
      setMoveError(`${isUndo ? 'Could not undo. ' : ''}${error instanceof Error ? error.message : 'Could not reassign beds. Refresh and try again.'}`);
    } finally {
      try { await fetchCalendarBookings(); }
      finally { movingRef.current = false; setMoving(false); setUndoing(false); }
    }
  };
  const dropMove = async (bedId: number, day: string) => {
    if (!dragRef.current || movingRef.current || pendingSwap) return;
    const source = dragRef.current;
    cancelMove();
    if (day !== (source.grabbedDay ?? source.assignment.check_in)) {
      setMoveError('Drag straight to another bed in the same date column. To change dates, use Edit Booking.'); return;
    }
    if (source.bedId === bedId) return;
    const candidate = bedSwapCandidate(calendarBookings,source,bedId);
    if (candidate.multiple) {
      setMoveError('More than one booking occupies this bed during the stay. Choose a different bed.'); return;
    }
    const change = {source,bedId,...(candidate.assignment ? {swap:candidate.assignment} : {})};
    if (candidate.assignment) setPendingSwap(change);
    else await performBedChange(change);
  };
  const undoLastMove = async () => {
    if (!undoMove || movingRef.current || dragRef.current || pendingSwap) return;
    const reverse: BedChange = { source:{...undoMove.source,bedId:undoMove.bedId},bedId:undoMove.source.bedId,
      swap:undoMove.swap,isUndo:true };
    if (reverse.swap) setPendingSwap(reverse); else await performBedChange(reverse);
  };
  const bedLabel = (id: number) => {
    const room=rooms.find(room=>room.beds.some(bed=>bed.bed_id===id));
    return `${room?.room_name ?? 'Room'} / ${room?.beds.find(bed=>bed.bed_id===id)?.bed_name ?? id}`;
  };
  const openBooking = async (id: number) => {
    if (movingRef.current) return;
    const request = ++detailRequest.current;
    setOpening(true); setDetailError('');
    try {
      const booking = await getBedsAndRoomsForBooking(id);
      if (request === detailRequest.current) setSelectedBooking(booking);
    } catch { if (request === detailRequest.current) setDetailError('Could not open booking details. Please try again.'); }
    finally { if (request === detailRequest.current) setOpening(false); }
  };
  const createOnBed = (room: Room, bed: Bed, date: Date) => setDraft({
    data: { check_in: format(date, 'yyyy-MM-dd'), check_out: format(addDays(date, 1), 'yyyy-MM-dd'), number_of_adults: 1,
      guests_per_room: { [room.room_id]: 1 } },
  });
  return <div className="min-w-0 p-2 sm:p-4 text-slate-900">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-semibold">Room calendar</h1><p className="text-sm text-slate-500">Drag vertically to change beds. Change dates for the whole booking through Edit Booking.</p></div>
      <button disabled={moving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white" onClick={() => setDraft({data:{}})}>+ Add booking</button>
    </div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <fieldset disabled={moving} className="min-w-0"><DateRangeSelector startDate={range.start} endDate={range.end} onChange={(start,end) => { cancelMove(); setRange({start,end}); }} /></fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <button className={control} disabled={moving} onClick={() => { cancelMove(); setExpandedRooms(Object.fromEntries(rooms.map(room => [room.room_id,true]))); }}>Expand all</button>
        <button className={control} disabled={moving} onClick={() => { cancelMove(); setExpandedRooms(Object.fromEntries(rooms.map(room => [room.room_id,false]))); }}>Collapse all</button>
        <button className={control} disabled={busy || moving} onClick={() => { cancelMove(); void refresh(); }}>Refresh</button>
      </div>
    </div>
    {drag && <div role="status" className="fixed bottom-4 left-4 right-4 z-50 shadow-lg flex items-center justify-between gap-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
      <span>Moving {drag.assignment.booking_name} · {movedStay(drag.assignment, drag.assignment.check_in).nights} night{movedStay(drag.assignment, drag.assignment.check_in).nights === 1 ? '' : 's'}
        {target ? ` · ${targetRoom?.room_name} / ${targetBed?.bed_name} · ${format(parseISO(drag.assignment.check_in), 'dd MMM')} → ${format(parseISO(drag.assignment.check_out), 'dd MMM')}${target.day !== (drag.grabbedDay ?? drag.assignment.check_in) ? ' · Keep the same date column' : bedSwapCandidate(calendarBookings,drag,target.bedId).assignment ? ' · Exchange requires confirmation' : ''}` : ' · Choose another bed in the same date column'}
      </span><button className="underline" onClick={cancelMove}>Cancel move</button>
    </div>}
    {moving && <p role="status" className="mb-3 text-sm text-indigo-700">{undoing ? 'Restoring original beds…' : 'Checking availability and moving assignment…'}</p>}
    {(moveMessage || undoMove) && <div onMouseEnter={() => setNoticePaused(true)} onMouseLeave={() => setNoticePaused(false)}
      onFocus={() => setNoticePaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setNoticePaused(false); }} className="mb-3 flex flex-wrap items-center gap-3 text-sm text-emerald-700">
      <span role="status">{moveMessage || `${undoMove?.source.assignment.booking_name}: bed reassigned. Booking dates are unchanged.`}</span>
      {undoMove && <button type="button" disabled={moving || !!drag} onClick={() => void undoLastMove()}
        className="font-medium underline underline-offset-2 hover:text-emerald-900 disabled:opacity-50">{undoing ? 'Undoing…' : 'Undo move'}</button>}
    </div>}
    {moveError && <p role="alert" className="mb-3 text-sm text-red-700">{moveError}</p>}
    {detailError && <p role="alert" className="mb-3 text-sm text-red-700">{detailError}</p>}
    {opening && <p role="status" className="mb-3 text-sm">Opening booking…</p>}
    {busy && <p role="status" className="py-6 text-sm text-slate-500">Loading room availability…</p>}
    {failure && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{failure} <button className="underline" onClick={() => void refresh()}>Retry</button></p>}
    {!busy && !failure && <>
      {!visibleRooms.length ? <p className="p-6 text-sm text-slate-500">No rooms to display.</p> : <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200" aria-label="Room availability calendar">
        <div className="min-w-fit">
          <div className="sticky top-0 z-30 bg-white">
            <div className="grid border-b border-slate-200" style={grid}><div className="sticky left-0 z-40 bg-white p-3 text-sm font-semibold">Room / bed</div><CalendarHeader dates={dates} today={today} /></div>
            <div className="grid border-b border-slate-200 bg-white text-xs" style={grid}><div className="sticky left-0 z-40 bg-white p-2 font-semibold">Available beds</div>{dates.map(date => <div key={date.toISOString()} className={`p-2 text-center font-semibold ${dateShade(date,today)}`}>{freeBeds(visibleRooms, calendarBookings,date)}</div>)}</div>
          </div>
          {visibleRooms.map(room => {
            const expanded = expandedRooms[room.room_id] ?? true;
            return <div key={room.room_id}>
              <div className="grid border-b border-slate-200 bg-slate-100" style={grid}>
                <button disabled={moving} aria-expanded={expanded} className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left text-sm font-semibold" onClick={() => setExpandedRooms(prev => ({...prev,[room.room_id]:!(prev[room.room_id] ?? true)}))}>{expanded ? '▾' : '▸'} {room.room_name}</button>
                {dates.map(date => <div key={date.toISOString()} className="p-2 text-center text-xs text-slate-600">{!expanded && `${freeBeds([room],calendarBookings,date)} available`}</div>)}
              </div>
              {expanded && room.beds.map(bed => <BedRow key={bed.bed_id} bedId={bed.bed_id} bedName={bed.bed_name} disabled={moving} drag={drag} target={target} allBookings={calendarBookings} onBeginMove={beginMove} onCancelMove={cancelMove} onTarget={setTarget} onDropMove={(bedId,day) => void dropMove(bedId,day)} dates={dates} today={today} bookingsByDate={calendarBookings[bed.bed_id] || {}} onBookingClick={id => void openBooking(id)} onEmptyClick={date => createOnBed(room,bed,date)} />)}
            </div>;
          })}
        </div>
      </div>}
    </>}
    {pendingSwap?.swap && <Modal isOpen onClose={() => setPendingSwap(null)} title={pendingSwap.isUndo ? 'Undo bed exchange?' : 'Exchange these beds?'}>
      <div className="space-y-3 text-sm text-slate-700">
        <p className="rounded-lg bg-amber-50 p-3 text-amber-900">This changes the bed assignment for both bookings. Check both stays before confirming. Their dates and payment amounts will not change.</p>
        <p><strong>{pendingSwap.source.assignment.booking_name}</strong>: {bedLabel(pendingSwap.source.bedId)} → {bedLabel(pendingSwap.bedId)}<br />{pendingSwap.source.assignment.check_in} to {pendingSwap.source.assignment.check_out}</p>
        <p><strong>{pendingSwap.swap.booking_name}</strong>: {bedLabel(pendingSwap.bedId)} → {bedLabel(pendingSwap.source.bedId)}<br />{pendingSwap.swap.check_in} to {pendingSwap.swap.check_out}</p>
        <p>Both beds must be available for each booking’s full stay. If either conflicts, nothing will change.</p>
        <div className="flex justify-end gap-3"><button className={control} onClick={() => setPendingSwap(null)}>Cancel</button><button className="rounded-lg bg-indigo-600 px-3 py-2 text-white" onClick={() => void performBedChange(pendingSwap)}>Confirm exchange</button></div>
      </div>
    </Modal>}
    {draft && <AddBookingModal isOpen initialData={draft.data} onClose={() => setDraft(null)} onSuccess={refresh} />}
    {selectedBooking && <BookingDetailsModal isOpen booking={selectedBooking} onClose={() => setSelectedBooking(null)} onSave={async saved => { await refresh(); setSelectedBooking(saved); return saved; }} />}
  </div>;
}
