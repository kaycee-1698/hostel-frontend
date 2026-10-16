'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownIcon, ArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BookingColumn, BookingSort, ColumnFilter, DateOperator, dateOperators, formatValue } from '@/lib/bookingFilters';

interface Props {
  column: BookingColumn;
  anchor: HTMLButtonElement;
  options: string[];
  filter?: ColumnFilter;
  sort: BookingSort;
  onFilter: (filter?: ColumnFilter) => void;
  onSort: (direction: 'asc' | 'desc' | null) => void;
  onClose: () => void;
}

export default function ColumnFilterMenu({ column, anchor, options, filter, sort, onFilter, onSort, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 80, left: 16 });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set(filter?.kind === 'values' ? filter.values : options));
  const [operator, setOperator] = useState<DateOperator>(filter?.kind === 'date' ? filter.operator : 'on');
  const [date, setDate] = useState(filter?.kind === 'date' ? filter.date : '');
  const isDate = column.type === 'date';
  const matches = options.filter(value => formatValue(value, column).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const allMatchesSelected = matches.length > 0 && matches.every(value => selected.has(value));
  const activeSort = sort?.key === column.key ? sort.direction : null;

  useLayoutEffect(() => {
    const positionPanel = () => {
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 24);
      const height = panel.current?.offsetHeight || 450;
      const top = rect.bottom + 8 + height <= window.innerHeight - 12
        ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
      setPosition({ top, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)) });
    };
    positionPanel();
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);
    return () => {
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
    };
  }, [anchor]);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('input, select, button')?.focus();
  }, []);

  const close = () => { onClose(); anchor.focus(); };
  const changeSort = (direction: 'asc' | 'desc' | null) => { onSort(direction); close(); };
  const apply = () => {
    if (isDate) {
      if (!date) return;
      onFilter({ kind: 'date', operator, date });
    } else {
      onFilter(selected.size === options.length && options.every(value => selected.has(value))
        ? undefined : { kind: 'values', values: [...selected] });
    }
    close();
  };
  const sortLabels = isDate ? ['Oldest first', 'Newest first'] : column.type === 'number'
    ? ['Smallest first', 'Largest first'] : ['A → Z', 'Z → A'];

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/10 sm:bg-transparent" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="column-filter-title"
        style={{ top: position.top, left: position.left, width: 'min(320px, calc(100vw - 24px))', maxHeight: 'calc(100dvh - 24px)' }}
        className="fixed flex flex-col overflow-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-xl"
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); close(); }
          if (event.key === 'Tab') {
            const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)') || []);
            const first = elements[0], last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}>
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 id="column-filter-title" className="font-semibold text-slate-900">{column.label}</h2>
          <button type="button" aria-label="Close column menu" onClick={close} className="rounded-md p-1.5 hover:bg-slate-100"><XMarkIcon className="h-4 w-4" /></button>
        </div>
        <div className="px-4 pb-3 pt-2">
          <p className="mb-2 text-xs font-medium text-slate-500">Sort</p>
          <div className="grid grid-cols-2 gap-2">
            {(['asc', 'desc'] as const).map((direction, index) => {
              const Icon = direction === 'asc' ? ArrowUpIcon : ArrowDownIcon;
              return <button key={direction} type="button" aria-pressed={activeSort === direction}
                onClick={() => changeSort(direction)} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium ${activeSort === direction ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />{sortLabels[index]}
              </button>;
            })}
          </div>
          {activeSort && <button type="button" onClick={() => changeSort(null)} className="mt-2 text-xs text-indigo-700 hover:underline">Remove sorting</button>}
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{isDate ? 'Filter by date' : 'Choose values'}</span>
            <button type="button" disabled={!filter} onClick={() => { onFilter(undefined); close(); }} className="text-xs text-indigo-700 hover:underline disabled:text-slate-400 disabled:no-underline">Clear filter</button>
          </div>
          {isDate ? <div className="space-y-3">
            <label className="block text-xs font-medium">Condition
              <select value={operator} onChange={event => setOperator(event.target.value as DateOperator)} className="mt-1.5 w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-indigo-500">
                {dateOperators.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">Date
              <input type="date" required value={date} onChange={event => setDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-indigo-500" />
            </label>
            <p className="text-xs leading-relaxed text-slate-500">Combined with the check-in month and any other active filters.</p>
          </div> : <>
            <input type="search" aria-label={`Search ${column.label} values`} value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a value…" className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            <div className="mb-2 flex items-center justify-between text-xs">
              <button type="button" disabled={!matches.length} className="font-medium text-indigo-700 disabled:text-slate-400" onClick={() => setSelected(previous => {
                const next = new Set(previous);
                matches.forEach(value => { if (allMatchesSelected) next.delete(value); else next.add(value); });
                return next;
              })}>{allMatchesSelected ? 'Deselect' : 'Select'} {search ? 'matches' : 'all'}</button>
              <span className="text-slate-500">{selected.size} selected</span>
            </div>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 py-1" role="group" aria-label={`${column.label} values`}>
              {matches.map(value => <label key={value} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                <input type="checkbox" checked={selected.has(value)} className="h-4 w-4 shrink-0 accent-indigo-600" onChange={() => setSelected(previous => {
                  const next = new Set(previous);
                  if (next.has(value)) next.delete(value); else next.add(value);
                  return next;
                })} />
                <span className="min-w-0 break-words">{formatValue(value, column)}</span>
              </label>)}
              {!matches.length && <p className="px-3 py-5 text-center text-xs text-slate-500">No matching values.</p>}
            </div>
            <p className="mt-2 text-xs text-slate-500">Values reflect the other active filters.</p>
          </>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={close} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={apply} disabled={isDate && !date} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">Apply filter</button>
        </div>
      </div>
    </div>, document.body,
  );
}
