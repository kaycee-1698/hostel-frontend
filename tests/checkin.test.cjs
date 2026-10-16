const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const sandbox = { exports: {}, console, Error, process: { env: { NEXT_PUBLIC_API_URL: 'http://test' } },
    ...globals, require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    } };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}

function harness(file, dependencies, initial = []) {
  const state = [...initial], refs = [];
  let index = 0, refIndex = 0;
  const react = {
    useState(value) {
      const slot = index++;
      if (!(slot in state)) state[slot] = typeof value === 'function' ? value() : value;
      return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next; }];
    },
    useRef(value) { const slot = refIndex++; return refs[slot] ||= { current: value }; },
    useEffect() {},
  };
  const jsx = (type, props) => ({ type, props });
  const component = load(file, { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, ...dependencies }, { alert() {} }).default;
  return { state, refs, render(props) { index = 0; refIndex = 0; return component(props); } };
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = find(child, predicate); if (match) return match;
  }
}

test('guest API rejects server failures, non-JSON errors and missing confirmations', async () => {
  for (const response of [
    { ok: false, json: async () => ({ message: 'Database unavailable' }) },
    { ok: false, json: async () => { throw Error('HTML response'); } },
    { ok: true, json: async () => ({ guest: null }) },
  ]) {
    const api = load('lib/api.ts', {}, { fetch: async () => response });
    await assert.rejects(api.createGuest({ first_name: 'Test' }));
  }
  const api = load('lib/api.ts', {}, { fetch: async () => ({ ok: true, json: async () => ({ guest: { guest_id: 1 } }) }) });
  assert.equal((await api.createGuest({})).guest.guest_id, 1);
});

test('image reader rejects oversized and unsupported files before reading', async () => {
  const api = load('lib/api.ts');
  await assert.rejects(api.readGuestImage({ type: 'image/gif', size: 20 }), /JPEG or PNG/);
  await assert.rejects(api.readGuestImage({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/);
});

test('failed check-in remains editable and displays the error', async () => {
  const h = harness('components/Checkin/CheckInForm.tsx', {
    'react-signature-canvas': () => null,
    '@/lib/api': { createGuest: async () => { throw Error('Save failed'); } },
  });
  const props = { booking: { booking_id: 7 } };
  await h.render(props).props.onSubmit({ preventDefault() {} });
  const rendered = h.render(props);
  assert.equal(rendered.type, 'form');
  assert.equal(find(rendered, node => node.props?.role === 'alert').props.children, 'Save failed');
});

test('submits current signature and booking once; success prevents repeat submission', async () => {
  let calls = 0, payload, resolve;
  const pending = new Promise(done => { resolve = done; });
  const h = harness('components/Checkin/CheckInForm.tsx', {
    'react-signature-canvas': () => null,
    '@/lib/api': { createGuest: async data => { calls++; payload = data; await pending; } },
  }, [{ first_name: 'Test', booking_id: 99, signature: 'stale' }]);
  const props = { booking: { booking_id: 7 } };
  const form = h.render(props);
  const canvas = find(form, node => node.props?.canvasProps);
  canvas.props.ref.current = { isEmpty: () => false, toDataURL: () => 'current-signature' };
  const saving = form.props.onSubmit({ preventDefault() {} });
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(calls, 1);
  assert.equal(payload.signature, 'current-signature');
  assert.equal(payload.booking_id, 7);
  resolve(); await saving;
  assert.equal(h.render(props).props.role, 'status');
});

test('clearing signature removes stale saved image from submission', async () => {
  let payload;
  const h = harness('components/Checkin/CheckInForm.tsx', {
    'react-signature-canvas': () => null,
    '@/lib/api': { createGuest: async data => { payload = data; } },
  }, [{ signature: 'old-signature' }]);
  const form = h.render({ booking: { booking_id: 7 } });
  find(form, node => node.props?.canvasProps).props.ref.current = { isEmpty: () => true };
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(payload.signature, undefined);
});

test('adult field rejects negative and decimal counts without creating invalid arrays', () => {
  const h = harness('components/Bookings/BookingForm.tsx', {
    'date-fns': require('date-fns'), '@/hooks/useRooms': { useRooms: () => ({ rooms: [] }) },
  });
  for (const value of ['-1', '1.5', '10000000000']) {
    const form = h.render({ onSave() {}, onClose() {} });
    const input = find(form, node => node.type === 'input' && node.props.max === 1000);
    assert.doesNotThrow(() => input.props.onChange({ target: { value } }));
    const rerender = h.render({ onSave() {}, onClose() {} });
    assert.equal(find(rerender, node => node.type === 'input' && node.props.max === 1000).props.value, 1);
  }
});

test('unreadable image blocks check-in until the invalid selection is cleared', async () => {
  let calls = 0;
  const h = harness('components/Checkin/CheckInForm.tsx', {
    'react-signature-canvas': () => null,
    '@/lib/api': { readGuestImage: async () => { throw Error('Invalid image'); },
      createGuest: async () => { calls++; } },
  });
  const props = { booking: { booking_id: 7 } };
  const form = h.render(props);
  const input = find(form, node => node.props?.name === 'id_front');
  input.props.onChange({ target: { files: [{ type: 'image/gif' }] } });
  // The read failure is handled asynchronously by the form.
  await new Promise(resolve => setImmediate(resolve));
  await h.render(props).props.onSubmit({ preventDefault() {} });
  assert.equal(calls, 0);
  input.props.onChange({ target: { files: [] } });
  await h.render(props).props.onSubmit({ preventDefault() {} });
  assert.equal(calls, 1);
});

test('clearing the booking check-in date does not crash rendering', () => {
  const h = harness('components/Bookings/BookingForm.tsx', {
    'date-fns': require('date-fns'), '@/hooks/useRooms': { useRooms: () => ({ rooms: [] }) },
  });
  const props = { onSave() {}, onClose() {} };
  const form = h.render(props);
  const input = find(form, node => node.type === 'input' && node.props.type === 'date');
  input.props.onChange({ target: { value: '' } });
  assert.doesNotThrow(() => h.render(props));
});

test('booking save blocks rapid repeated clicks and calls success once', async () => {
  let calls = 0, successes = 0, savedCloses = 0, resolve;
  const pending = new Promise(done => { resolve = done; });
  const h = harness('components/Bookings/BookingForm.tsx', {
    'date-fns': require('date-fns'), '@/hooks/useRooms': { useRooms: () => ({ rooms: [] }) },
  });
  const props = { initialData: { preferred_bed_id: 7, booking_name: 'Test', number_of_adults: 1, base_amount: 100,
    check_in: '2026-10-20', check_out: '2026-10-21', guests_per_room: {1:1} },
    onSave: async payload => { assert.equal(payload.preferred_bed_id,undefined); calls++; await pending; }, onSuccess: () => { successes++; }, onSaved() { savedCloses++; }, onClose() { throw Error("Save invoked cancel handler"); } };
  h.render(props);
  h.state[10] = {1:2}; // Availability normally supplied by the room API effect.
  const save = find(h.render(props), n => n.type === 'button' && n.props.children === 'Save');
  const first = save.props.onClick();
  await save.props.onClick();
  assert.equal(calls,1);
  assert.equal(find(h.render(props), n => n.props?.['aria-busy'] === true).props.disabled,true);
  resolve(); await first;
  await save.props.onClick();
  assert.equal(calls,1); assert.equal(successes,1); assert.equal(savedCloses,1);
});

test('deletion displays backend explanation', async () => {
  const api = load('lib/api.ts', {}, {fetch: async () => ({ok:false,json:async () => ({error:'This booking has guest check-in records and cannot be deleted.'})})});
  await assert.rejects(api.deleteBooking(117), /guest check-in records/);
});

test('adult count can be cleared and retyped, but cannot be saved blank', async () => {
  let saves=0;
  const h=harness('components/Bookings/BookingForm.tsx', {
    'date-fns':require('date-fns'), '@/hooks/useRooms':{useRooms:()=>({rooms:[]})},
  });
  const props={onSave(){saves++;},onClose(){}};
  const input=()=>find(h.render(props),n=>n.type==='input' && n.props.max===1000);
  input().props.onChange({target:{value:''}});
  assert.equal(input().props.value,'');
  await find(h.render(props),n=>n.type==='button' && n.props.children==='Save').props.onClick();
  assert.equal(saves,0);
  input().props.onChange({target:{value:'3'}});
  assert.equal(input().props.value,3);
});
