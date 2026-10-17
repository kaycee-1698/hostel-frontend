import CollectPaymentButton from './CollectPaymentButton';
import { Booking } from '@/types';
import { bookingColumns, cellValue, formatValue } from '@/lib/bookingFilters';

interface Props {
  booking: Booking;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRowClick: () => void;
  onPaymentSaved: () => Promise<void>;
}

export default function BookingRow({ booking, isSelected, onToggleSelect, onRowClick, onPaymentSaved }: Props) {
  return (
    <tr onClick={onRowClick} className={`group cursor-pointer transition-colors hover:bg-indigo-50/50 ${isSelected ? 'bg-indigo-50/70' : 'bg-white'}`}>
      <td className="border-b border-slate-100 px-3 py-3" onClick={event => event.stopPropagation()}>
        <input type="checkbox" checked={isSelected} aria-label={`Select ${booking.booking_name}`} onChange={onToggleSelect} className="h-4 w-4 cursor-pointer accent-indigo-600" />
      </td>
      {bookingColumns.map(column => {
        const value = cellValue(booking, column.key);
        return <td key={column.key} className={`border-b border-slate-100 px-3 py-3 ${column.type === 'number' ? 'text-right tabular-nums' : ''} ${column.type === 'date' || column.key === 'contact_number' ? 'whitespace-nowrap' : ''}`}>
          {column.key === 'booking_name' ? <button type="button" onClick={event => { event.stopPropagation(); onRowClick(); }} className="max-w-64 truncate text-left font-medium text-slate-900 hover:text-indigo-700 hover:underline" title={value}>{value || 'Unnamed booking'}</button>
            : column.key === 'pending_amount' ? <div className="flex flex-col items-end gap-1"><span className="text-rose-700">{formatValue(value,column)}</span><CollectPaymentButton id={booking.booking_id} name={booking.booking_name} pending={booking.pending_amount} onSaved={onPaymentSaved}/></div>
            : column.key === 'payment_status' ? <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${value === 'Paid' ? 'bg-emerald-50 text-emerald-700' : value === 'Unpaid' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>{value || '—'}</span>
              : <span className="text-slate-600">{value === '' ? '—' : formatValue(value, column)}</span>}
        </td>;
      })}
    </tr>
  );
}
