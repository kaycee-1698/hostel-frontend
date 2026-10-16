const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const scope = { exports: {}, console, Date, ...globals, require(name) {
    if (name in dependencies) return dependencies[name];
    throw Error(`Unexpected dependency ${name}`);
  } };
  vm.runInNewContext(js, scope);
  return scope.exports;
}
const filters = load('lib/bookingFilters.ts');
const all = { search: '', period: 'all', month: '2026-10' };
const rows = [
  { booking_id: 1, booking_name: 'Zara', contact_number: '+91 98765-43210', check_in: '2026-10-01', check_out: '2026-10-03', ota_name: 'Direct', payment_status: 'Paid', number_of_adults: 2, pending_amount: 0, bank: 'Secondary' },
  { booking_id: 2, booking_name: 'Anita', contact_number: '', check_in: '2026-10-31', check_out: '2026-11-02', ota_name: 'Website', payment_status: 'Unpaid', number_of_adults: 10, pending_amount: '100', bank: 'Primary' },
  { booking_id: 3, booking_name: 'Brian', contact_number: null, check_in: '2025-10-15', check_out: '2025-10-20', ota_name: 'Direct', payment_status: 'Unpaid', number_of_adults: 3, pending_amount: 20, bank: null },
  { booking_id: 4, booking_name: 'Maya', contact_number: '7777', check_in: '2026-09-30', check_out: '2026-10-02', ota_name: 'Direct', payment_status: 'Paid', number_of_adults: 1, pending_amount: null, bank: 'Secondary' },
];
const ids = list => Array.from(list, row => row.booking_id);

test('default uses current India check-in month and custom month distinguishes years', () => {
  const view = filters.initialBookingView();
  assert.equal(view.period, 'current');
  assert.equal(view.month, filters.currentMonth());
  assert.deepEqual(ids(filters.filterBookings(rows, { ...all, period: 'custom', month: '2026-10' }, {})), [1, 2]);
  assert.deepEqual(ids(filters.filterBookings(rows, { ...all, period: 'custom', month: '2025-10' }, {})), [3]);
  // A stay crossing into October is excluded when its check-in is in September.
  assert.deepEqual(ids(filters.filterBookings(rows, all, {})), [1, 2, 3, 4]);
});
test('search handles mixed case, trimmed names, formatted phone numbers and blank contacts', () => {
  assert.deepEqual(ids(filters.filterBookings(rows, { ...all, search: '  zArA  ' }, {})), [1]);
  assert.deepEqual(ids(filters.filterBookings(rows, { ...all, search: '9876543210' }, {})), [1]);
  assert.deepEqual(ids(filters.filterBookings(rows, { ...all, search: 'missing' }, {})), []);
});
test('column selections combine with search and month; explicit empty selection shows none', () => {
  assert.deepEqual(ids(filters.filterBookings(rows, { ...all, period: 'custom' }, {
    ota_name: { kind: 'values', values: ['Direct'] }, payment_status: { kind: 'values', values: ['Paid'] },
  })), [1]);
  assert.deepEqual(ids(filters.filterBookings(rows, all, { ota_name: { kind: 'values', values: [] } })), []);
  assert.deepEqual(ids(filters.filterBookings(rows, all, { contact_number: { kind: 'values', values: [''] } })), [2, 3]);
});
test('all five date operators treat equality correctly for both date columns', () => {
  const expected = { before: [true, false, false], beforeOrOn: [true, true, false], on: [false, true, false], onOrAfter: [false, true, true], after: [false, false, true] };
  for (const [operator, results] of Object.entries(expected)) {
    for (const [i, date] of ['2026-10-14', '2026-10-15', '2026-10-16'].entries()) {
      assert.equal(filters.matchesDate(date, operator, '2026-10-15'), results[i]);
      for (const key of ['check_in', 'check_out']) {
        assert.equal(filters.filterBookings([{ ...rows[0], [key]: date }], all, {
          [key]: { kind: 'date', operator, date: '2026-10-15' },
        }).length, results[i] ? 1 : 0);
      }
    }
    assert.equal(filters.matchesDate('', operator, '2026-10-15'), false);
  }
});
test('numeric sorting handles decimal strings and keeps blanks last without mutating source', () => {
  assert.deepEqual(ids(filters.sortBookings(rows, { key: 'number_of_adults', direction: 'asc' })), [4, 1, 3, 2]);
  assert.deepEqual(ids(filters.sortBookings(rows, { key: 'pending_amount', direction: 'desc' })), [2, 3, 1, 4]);
  assert.deepEqual(ids(filters.sortBookings(rows, { key: 'booking_name', direction: 'asc' })), [2, 3, 4, 1]);
  assert.deepEqual(ids(rows), [1, 2, 3, 4]);
});
test('date sorting is chronological and supports both directions', () => {
  assert.deepEqual(ids(filters.sortBookings(rows, { key: 'check_in', direction: 'asc' })), [3, 4, 1, 2]);
  assert.deepEqual(ids(filters.sortBookings(rows, { key: 'check_out', direction: 'desc' })), [2, 1, 4, 3]);
});
test('filter value lists ignore their own filter but respect other columns', () => {
  const column = filters.bookingColumns.find(column => column.key === 'ota_name');
  const options = filters.columnOptions(rows, all, {
    ota_name: { kind: 'values', values: ['Direct'] }, payment_status: { kind: 'values', values: ['Unpaid'] },
  }, column);
  assert.deepEqual(Array.from(options), ['Direct', 'Website']);
});
test('selected values remain removable when another filter leaves no matching rows', () => {
  const column = filters.bookingColumns.find(column => column.key === 'ota_name');
  assert.deepEqual(Array.from(filters.columnOptions(rows, { ...all, search: 'missing' }, {
    ota_name: { kind: 'values', values: ['Direct'] },
  }, column)), ['Direct']);
});

const jsx = (type, props) => ({ type, props });
const icons = new Proxy({}, { get: (_, key) => String(key) });
function harness(file, dependencies, globals = {}) {
  const state = [];
  let index = 0;
  const react = { useState(value) {
    const slot = index++;
    if (!(slot in state)) state[slot] = typeof value === 'function' ? value() : value;
    return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
  }, useEffect() {}, useLayoutEffect() {}, useRef: () => ({ current: null }), useMemo: fn => fn() };
  const Component = load(file, {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-dom': { createPortal: child => child },
    '@heroicons/react/24/outline': icons, '@/lib/bookingFilters': filters, ...dependencies,
  }, { document: { body: {} }, ...globals }).default;
  return { render(props) { index = 0; return Component(props); } };
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
}
function text(node) {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return '';
  return [node.props?.children].flat(Infinity).map(text).join('');
}

test('column selection is staged until Apply and Cancel does not change the filter', () => {
  const h = harness('components/Bookings/ColumnFilterMenu.tsx', {});
  let applied, closed = 0;
  const props = { column: filters.bookingColumns[1], anchor: { focus() {} }, options: ['Direct', 'Website'], sort: null,
    onFilter: value => { applied = value; }, onSort() {}, onClose: () => closed++ };
  let menu = h.render(props);
  find(menu, node => node.type === 'input' && node.props.type === 'checkbox').props.onChange();
  assert.equal(applied, undefined);
  menu = h.render(props);
  find(menu, node => node.type === 'button' && text(node) === 'Cancel').props.onClick();
  assert.equal(applied, undefined);
  find(menu, node => node.type === 'button' && text(node) === 'Apply filter').props.onClick();
  assert.deepEqual(Array.from(applied.values), ['Website']);
  assert.equal(closed, 2);
});
test('date menu requires a date and applies the chosen comparison', () => {
  const h = harness('components/Bookings/ColumnFilterMenu.tsx', {});
  let applied;
  const props = { column: filters.bookingColumns[4], anchor: { focus() {} }, options: [], sort: null,
    onFilter: value => { applied = value; }, onSort() {}, onClose() {} };
  let menu = h.render(props);
  assert.equal(find(menu, node => node.type === 'button' && text(node) === 'Apply filter').props.disabled, true);
  find(menu, node => node.type === 'select').props.onChange({ target: { value: 'beforeOrOn' } });
  find(menu, node => node.type === 'input').props.onChange({ target: { value: '2026-10-15' } });
  menu = h.render(props);
  find(menu, node => node.type === 'button' && text(node) === 'Apply filter').props.onClick();
  assert.equal(applied.operator, 'beforeOrOn');
  assert.equal(applied.date, '2026-10-15');
});
test('view all clears search, month, column filters and sorting together', () => {
  const h = harness('components/Bookings/BookingsDashboard.tsx', {
    '@/hooks/useBookings': { useBookings: () => ({ bookings: rows, fetchBookings: async () => {} }) },
    '@/lib/api': {}, './BookingsTable': { default: 'Table' }, './BookingFilters': { default: 'Filters' }, './AddBookingModal': { default: 'Modal' },
  });
  let page = h.render({});
  find(page, node => node.type === 'Filters').props.onChange({ ...all, search: 'Zara' });
  find(page, node => node.type === 'Table').props.onFilter('ota_name', { kind: 'values', values: ['Direct'] });
  find(page, node => node.type === 'Table').props.onSort({ key: 'pending_amount', direction: 'desc' });
  page = h.render({});
  assert.deepEqual(ids(find(page, node => node.type === 'Table').props.bookings), [1]);
  find(page, node => node.type === 'Filters').props.onClear();
  page = h.render({});
  const table = find(page, node => node.type === 'Table');
  assert.deepEqual(ids(table.props.bookings), [1, 2, 3, 4]);
  assert.equal(table.props.sort, null);
  assert.equal(Object.keys(table.props.filters).length, 0);
  assert.equal(table.props.view.search, '');
  assert.equal(table.props.view.period, 'all');
});

test('hidden selections cannot carry over into the visible selection count', () => {
  const h = harness('components/Bookings/BookingsTable.tsx', {
    '@/lib/api': {}, './BookingRow': { default: 'BookingRow' }, './BookingDetailsModal': { default: 'Details' }, './ColumnFilterMenu': { default: 'Menu' },
  });
  const props = { bookings: rows, allBookings: rows, view: all, filters: {}, sort: null,
    onFilter() {}, onSort() {}, onClear() {}, onDelete() {}, onSaved() {} };
  let table = h.render(props);
  find(table, node => node.type === 'BookingRow' && node.props.booking.booking_id === 1).props.onToggleSelect();
  table = h.render(props);
  assert.ok(find(table, node => node.type === 'button' && text(node) === 'Delete selected'));
  table = h.render({ ...props, bookings: [rows[1]] });
  assert.equal(find(table, node => node.type === 'button' && text(node) === 'Delete selected'), undefined);
  assert.equal(find(table, node => node.props?.['aria-label'] === 'Select all visible bookings').props.checked, false);
});

test('today uses India time at the UTC day boundary', () => {
  assert.equal(filters.hostelToday(new Date('2026-10-15T18:29:59Z')), '2026-10-15');
  assert.equal(filters.hostelToday(new Date('2026-10-15T18:30:00Z')), '2026-10-16');
  assert.equal(filters.currentMonth(new Date('2026-10-31T18:30:00Z')), '2026-11');
});
test('arrivals view uses exact check-in day and supports further search and column filters', () => {
  const view = filters.quickBookingView('arrivals', '2026-10-01');
  assert.deepEqual(ids(filters.filterBookings(rows, view, {})), [1]);
  assert.deepEqual(ids(filters.filterBookings(rows, { ...view, search: 'missing' }, {})), []);
  assert.deepEqual(ids(filters.filterBookings(rows, view, { ota_name: { kind: 'values', values: ['Website'] } })), []);
  assert.deepEqual(ids(filters.filterBookings(rows, filters.quickBookingView('arrivals', '2026-10-02'), {})), []);
});
test('outstanding view includes older and future bookings but excludes credits and paid tolerance', () => {
  const data = [0, 5, 5.01, -100, null, '20', 'invalid', Infinity].map((pending_amount, i) => ({ ...rows[i % rows.length], booking_id: i, pending_amount }));
  const view = filters.quickBookingView('outstanding', '2026-10-16');
  const visible = filters.filterBookings(data, view, {});
  assert.deepEqual(ids(visible), [2, 5]);
  assert.equal(visible.reduce((sum, row) => sum + filters.outstandingAmount(row), 0), 25.009999999999998);
  assert.deepEqual(ids(filters.filterBookings(rows, view, {})), [2, 3]);
});
test('quick view resets old filters, sorts outstanding balances, and clear restores all bookings', () => {
  const h = harness('components/Bookings/BookingsDashboard.tsx', {
    '@/hooks/useBookings': { useBookings: () => ({ bookings: rows, fetchBookings: async () => {} }) },
    '@/lib/api': {}, './BookingsTable': { default: 'Table' }, './BookingFilters': { default: 'Filters' }, './AddBookingModal': { default: 'Modal' },
  });
  let page = h.render({});
  find(page, node => node.type === 'Filters').props.onChange({ ...all, search: 'Zara' });
  find(page, node => node.type === 'Table').props.onFilter('ota_name', { kind: 'values', values: ['Direct'] });
  find(page, node => node.type === 'Filters').props.onQuickView('outstanding');
  page = h.render({});
  let table = find(page, node => node.type === 'Table');
  assert.equal(table.props.view.search, '');
  assert.equal(table.props.view.period, 'all');
  assert.equal(table.props.view.quickView, 'outstanding');
  assert.equal(Object.keys(table.props.filters).length, 0);
  assert.equal(table.props.sort.direction, 'desc');
  assert.deepEqual(ids(table.props.bookings), [2, 3]);
  find(page, node => node.type === 'Filters').props.onClear();
  page = h.render({});
  table = find(page, node => node.type === 'Table');
  assert.equal(table.props.view.quickView, undefined);
  assert.deepEqual(ids(table.props.bookings), [1, 2, 3, 4]);
});
