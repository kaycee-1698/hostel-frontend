const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const dates = require('date-fns');
function load(file, deps, globals = {}) {
  const source = fs.readFileSync(`${__dirname}/../src/${file}`, 'utf8');
  const js = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2017, module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const scope = {exports:{}, ...globals, require:name => deps[name]};
  vm.runInNewContext(js, scope);
  return scope.exports;
}
test('calendar ignores stale success and failure, hides old range, and invalidates on unmount', async () => {
  let state, effect, cleanup, ref = {current:0};
  const requests = [];
  const react = {
    useState: initial => { state ??= initial; return [state, next => {state = next;}]; },
    useRef: () => ref,
    useCallback: callback => callback,
    useEffect: callback => {effect = callback;},
  };
  const {useCalendarBookings: hook} = load('hooks/useCalendarBookings.ts', {
    react, 'date-fns':dates,
    '@/lib/api': {getBookingsByBedAndDateRange: () => new Promise((resolve,reject) => requests.push({resolve,reject}))},
  });
  const render = day => hook(new Date(2026,9,day),new Date(2026,9,day));
  assert.equal(render(1).loading,true);
  cleanup = effect();
  requests[0].resolve({calendarBookings:{first:{}},unassignedBookings:[]}); await new Promise(setImmediate);
  assert.equal(render(1).loading,false);
  assert.equal(render(2).loading,true);
  cleanup(); cleanup = effect();
  const refresh = render(2).fetchCalendarBookings();
  requests[2].resolve({calendarBookings:{latest:{}},unassignedBookings:[]}); await refresh;
  requests[1].reject(Error('old failure')); await new Promise(setImmediate);
  assert.equal(render(2).error,null);
  assert.ok(render(2).calendarBookings.latest);
  const old = render(2).fetchCalendarBookings();
  const newer = render(2).fetchCalendarBookings();
  requests[4].resolve({calendarBookings:{newest:{}},unassignedBookings:[]}); await newer;
  requests[3].resolve({calendarBookings:{stale:{}},unassignedBookings:[]}); await old;
  assert.ok(render(2).calendarBookings.newest);
  const pending = render(2).fetchCalendarBookings();
  cleanup(); const before = state;
  requests[5].resolve({calendarBookings:{unmounted:{}},unassignedBookings:[]}); await pending;
  assert.equal(state,before);
});
test('date selector rejects empty and reversed ranges and accepts a single day', () => {
  let error, changed;
  const jsx = (type,props) => ({type,props});
  const {default: Selector} = load('components/RoomCalendar/DateRangeSelector.tsx', {
    react:{useState:() => ['', value => {error=value;}]},
    'react/jsx-runtime':{jsx,jsxs:jsx}, 'date-fns':dates,
  });
  const tree = Selector({startDate:new Date(2026,9,1),endDate:new Date(2026,9,5),onChange:(...args)=>{changed=args;}});
  const inputs = tree.props.children[0].props.children.map(label=>label.props.children[1]);
  inputs[0].props.onChange({target:{value:''}});
  assert.match(error,/Choose both/); assert.equal(changed,undefined);
  inputs[1].props.onChange({target:{value:'2026-09-30'}});
  assert.match(error,/on or after/); assert.equal(changed,undefined);
  inputs[1].props.onChange({target:{value:'2026-10-01'}});
  assert.equal(error,''); assert.equal(changed[0].getTime(),changed[1].getTime());
});

const utils = load('lib/calendarUtils.ts', {'date-fns': dates});
test('default calendar shows yesterday, today and twelve days ahead', () => {
  const range = utils.defaultCalendarRange('2026-10-16');
  assert.equal(dates.format(range.start,'yyyy-MM-dd'),'2026-10-15');
  assert.equal(dates.format(range.end,'yyyy-MM-dd'),'2026-10-28');
  assert.equal(dates.eachDayOfInterval(range).length,14);
});
test('moves preserve full assignment duration and exclude only their own occupancy', () => {
  const assignment = {booking_bed_id:11, booking_id:5, check_in:'2026-10-10', check_out:'2026-10-13'};
  const drag = {assignment,bedId:1};
  const stay = utils.movedStay(assignment,'2026-10-31');
  assert.equal(stay.check_out,'2026-11-03'); assert.equal(stay.nights,3);
  const occupancy = {1:{'2026-10-11':assignment},2:{'2026-10-12':{...assignment,booking_bed_id:12}}};
  assert.equal(utils.visibleMoveConflict(occupancy,drag,1,'2026-10-11'),false);
  assert.equal(utils.visibleMoveConflict(occupancy,drag,2,'2026-10-11'),true);
  assert.equal(utils.visibleMoveConflict(occupancy,drag,2,'2026-10-13'),false);
});
test('availability totals follow visible rooms and count occupied beds once', () => {
  const rooms = [{beds:[{bed_id:1},{bed_id:2}]},{beds:[{bed_id:3}]}];
  const bookings = {1:{'2026-10-16':{booking_id:1}}};
  assert.equal(utils.freeBeds(rooms,bookings,new Date(2026,9,16)),2);
  assert.equal(utils.freeBeds([rooms[0]],bookings,new Date(2026,9,16)),1);
  assert.equal(utils.freeBeds(rooms,bookings,new Date(2026,9,17)),3);
  assert.equal(utils.dateShade(new Date(2026,9,17),'2026-10-17'),'bg-indigo-50');
  assert.equal(utils.dateShade(new Date(2026,9,18),'2026-10-17'),'bg-slate-50');
});

test('pointer dragging moves the full assignment; clicks below threshold remain clicks', () => {
  let picked, dropped, opened = 0, cancelled = 0;
  const jsx = (type,props) => ({type,props});
  const {default: Row} = load('components/RoomCalendar/BedRow.tsx', {
    react:{useRef:value => ({current:value})},'react/jsx-runtime':{jsx,jsxs:jsx},'date-fns':dates,
    '@/lib/calendarUtils':utils,
  }, {document:{elementFromPoint:() => ({closest:() => ({dataset:{calendarBed:'2',calendarDay:'2026-10-11'}})})},setTimeout:()=>{}});
  const booking = {booking_bed_id:11,booking_id:5,booking_name:'Guest',check_in:'2026-10-10',check_out:'2026-10-13'};
  const props = {bedId:1,bedName:'Bed 1',dates:[new Date(2026,9,11)],today:'2026-10-11',bookingsByDate:{'2026-10-11':booking},
    disabled:false,drag:null,target:null,allBookings:{},onBookingClick:()=>{opened++;},onBeginMove:value=>{picked=value;},onCancelMove(){cancelled++;},onTarget(){},onDropMove:(...args)=>{dropped=args;}};
  const button = Row(props).props.children[1][0].props.children[0];
  const event = {pointerId:1,button:0,clientX:10,clientY:10,preventDefault(){},currentTarget:{setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}}};
  button.props.onPointerDown(event);
  button.props.onPointerMove({...event,clientX:12});
  assert.equal(picked,undefined);
  button.props.onPointerUp(event); button.props.onClick(); assert.equal(opened,1);
  button.props.onPointerDown(event);
  button.props.onPointerMove({...event,clientX:30});
  assert.equal(picked.assignment.check_in,'2026-10-10');
  assert.equal(picked.assignment.check_out,'2026-10-13');
  button.props.onPointerUp({...event,clientX:30});
  assert.deepEqual(dropped,[2,'2026-10-11']);
  button.props.onClick(); assert.equal(opened,1);
  button.props.onPointerCancel(); assert.equal(cancelled,1);
});

test('undo restores original assignment, blocks repeat clicks, and retains retry on conflict', async () => {
  const state = [], refs = []; let index = 0, refIndex = 0;
  let requests = [], pendingResolve, failUndo = false, delayUndo = false;
  let calendarBookings = {};
  let noticeEffect, timeout, timeoutMs, cleared = false;
  const jsx = (type,props) => ({type,props});
  const react = {
    useState(initial) {const slot=index++; if (!(slot in state)) state[slot]=typeof initial==='function'?initial():initial;
      return [state[slot],value=>{state[slot]=typeof value==='function'?value(state[slot]):value;}];},
    useRef(initial) {const slot=refIndex++;return refs[slot] ||= {current:initial};},
    useEffect(fn,deps) { if(deps.length === 6) noticeEffect=fn; }, useMemo:fn=>fn(),
  };
  const {default: Calendar} = load('components/RoomCalendar/RoomCalendar.tsx', {
    react,'react/jsx-runtime':{jsx,jsxs:jsx},'date-fns':dates,
    '@/hooks/useUnsavedRates':{useUnsavedRates(){}},'next/link':{default:'Link'},'@/components/Rates/RateEditor':{default:'RateEditor'},
    '@/hooks/useRoomRates':{useRoomRates:()=>({rates:{},ready:true,saveRates(){}}),formatRate:()=> 'Set rate',rateKey:(id,day)=>`${id}:${day}`,validRate:()=>true},
    '@/lib/bookingFilters':{hostelToday:()=> '2026-10-16'},'@/lib/calendarUtils':utils,
    '@/hooks/useRooms':{useRooms:()=>({rooms:[{room_id:1,room_name:'Dorm',beds:[{bed_id:1,bed_name:'Bed 1'}]}],fetchRooms:async()=>{}})},
    '@/hooks/useBookings':{useBookings:()=>({})},
    '@/hooks/useCalendarBookings':{useCalendarBookings:()=>({calendarBookings,fetchCalendarBookings:async()=>{}})},
    '@/lib/api':{moveCalendarAssignment:async(id,payload)=>{
      requests.push({id,payload});
      if (failUndo) throw Error('The original bed is occupied.');
      if (delayUndo) await new Promise(resolve=>{pendingResolve=resolve;});
      return {};
    }},
    './CalendarHeader':{default:'Header'},'./DateRangeSelector':{default:'Dates'},'./BedRow':{default:'BedRow'},
    '../Modal/Modal':{default:'Modal'},
    '../Bookings/AddBookingModal':{default:'Add'},'../Bookings/BookingDetailsModal':{default:'Details'},
  }, {setTimeout(fn,ms){timeout=fn;timeoutMs=ms;return 1;},clearTimeout(){cleared=true;}});
  const render = () => {index=0;refIndex=0;return Calendar();};
  function find(node,predicate) {
    if(!node || typeof node!=='object')return;
    if(predicate(node))return node;
    for(const child of [node.props?.children].flat(Infinity)){const result=find(child,predicate);if(result)return result;}
  }
  const row = () => find(render(),node=>node.type==='BedRow');
  const undo = () => find(render(),node=>node.type==='button' && node.props.children==='Undo move');
  assert.equal(undo(),undefined);
  const source={bedId:1,assignment:{booking_bed_id:10,booking_id:2,booking_name:'Test',check_in:'2026-10-15',check_out:'2026-10-18'}};
  row().props.onBeginMove(source);
  row().props.onDropMove(3,'2026-10-15');
  await new Promise(setImmediate);
  assert.ok(undo());
  const cleanup=noticeEffect();assert.equal(timeoutMs,10000);cleanup();assert.equal(cleared,true);
  failUndo=true; undo().props.onClick(); await new Promise(setImmediate);
  assert.ok(undo()); assert.ok(find(render(),node=>node.props?.role==='alert'));
  failUndo=false;delayUndo=true;
  const button=undo();button.props.onClick();button.props.onClick();
  assert.equal(requests.length,3); // Move, rejected undo, one pending retry.
  const request=requests[2];
  assert.equal(request.id,10);
  assert.equal(request.payload.bed_id,1);
  assert.equal(request.payload.check_in,'2026-10-15');
  assert.equal(request.payload.expected_bed_id,3);
  assert.equal(request.payload.expected_check_in,'2026-10-15');
  assert.equal(request.payload.expected_check_out,'2026-10-18');
  pendingResolve();await new Promise(setImmediate);
  assert.equal(undo(),undefined);
  assert.ok(find(render(),node=>node.props?.role==='status' && /restored/.test(node.props.children)));
  delayUndo=false;
  row().props.onBeginMove(source);row().props.onDropMove(3,'2026-10-16');
  assert.equal(requests.length,3); // Horizontal date changes never save.
  calendarBookings={3:{'2026-10-15':{booking_bed_id:20,booking_id:4,booking_name:'Other',check_in:'2026-10-14',check_out:'2026-10-19'}}};
  row().props.onBeginMove(source);row().props.onDropMove(3,'2026-10-15');
  assert.ok(find(render(),node=>node.type==='Modal'));assert.equal(requests.length,3);
  find(render(),node=>node.type==='button' && node.props.children==='Cancel').props.onClick();
  assert.equal(find(render(),node=>node.type==='Modal'),undefined);assert.equal(requests.length,3);
  row().props.onBeginMove(source);row().props.onDropMove(3,'2026-10-15');
  find(render(),node=>node.type==='button' && node.props.children==='Confirm exchange').props.onClick();
  await new Promise(setImmediate);
  assert.equal(requests[3].payload.swap_assignment_id,20);assert.equal(requests[3].payload.confirm_swap,true);
  undo().props.onClick();assert.equal(requests.length,4);
  assert.ok(find(render(),node=>node.type==='Modal' && node.props.title==='Undo bed exchange?'));
  find(render(),node=>node.type==='button' && node.props.children==='Confirm exchange').props.onClick();
  await new Promise(setImmediate);
  assert.equal(requests[4].payload.bed_id,1);assert.equal(requests[4].payload.expected_bed_id,3);
  assert.equal(undo(),undefined);
  noticeEffect();assert.equal(timeoutMs,5000);timeout();
  assert.equal(find(render(),node=>node.props?.role==='status' && /restored/.test(node.props.children)),undefined);
});

test('unsaved-rate guard cancels links, refresh and Back; confirmed Back leaves once',()=>{
 const win={},doc={};let effect,answer=false,forward=0,back=0,confirmed=0;
 const browser={history:{state:{},pushState(){},forward(){forward++;},back(){back++;}},confirm(){confirmed++;return answer;},addEventListener(name,fn){win[name]=fn;},removeEventListener(name){delete win[name];}};
 const document={addEventListener(name,fn){doc[name]=fn;},removeEventListener(name){delete doc[name];}};
 const {useUnsavedRates}=load('hooks/useUnsavedRates.ts',{react:{useRef:value=>({current:value}),useEffect:fn=>{effect=fn;}}},{window:browser,document,location:{href:'http://local/calendar'}});
 useUnsavedRates(true);const cleanup=effect();let prevented=0,stopped=0;
 doc.click({button:0,target:{closest:()=>({href:'http://local/bookings',hasAttribute:()=>false})},preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});
 assert.equal(prevented,1);assert.equal(stopped,1);
 win.beforeunload({preventDefault(){prevented++;}});assert.equal(prevented,2);
 win.popstate({state:{},stopImmediatePropagation(){}});assert.equal(forward,1);assert.equal(back,0);
 win.popstate({state:{rateGuard:true}});answer=true;
 win.popstate({state:{},stopImmediatePropagation(){}});assert.equal(back,1);assert.equal(win.popstate,undefined);assert.equal(confirmed,3);
 cleanup();assert.equal(doc.click,undefined);
});
