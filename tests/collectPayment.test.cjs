const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function setup(){
 const states=[],refs=[],effects=[],requests=[],stored=new Map();let index=0,refIndex=0,closed=0;
 const jsx=(type,props)=>({type,props});
 const react={useState:initial=>{const key=index++;if(!(key in states))states[key]=initial;return [states[key],next=>{states[key]=typeof next==='function'?next(states[key]):next;}];},useRef:initial=>refs[refIndex++]??(refs[refIndex-1]={current:initial}),useEffect:fn=>effects.push(fn)};
 const api={getBookingById:async()=>({booking_id:1,pending_amount:100}),collectBookingPayment:(...args)=>new Promise((resolve,reject)=>requests.push({args,resolve,reject}))};
 const source=fs.readFileSync(__dirname+'/../src/components/Bookings/CollectPaymentButton.tsx','utf8');
 const scope={exports:{},require:name=>({react,'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/api':api}[name]),Intl,document:{activeElement:null},setTimeout:fn=>fn(),crypto:{randomUUID:()=> 'stable-request'},sessionStorage:{getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText+'\nexports.Popup=PaymentPopup;',scope);
 return {requests,stored,get closed(){return closed;},render:()=>{index=refIndex=0;return scope.exports.Popup({id:1,name:'Test',onClose:()=>closed++,onSaved:async()=>{throw Error('refresh failed');}});},mount:()=>effects.splice(0).forEach(fn=>fn())};
}
function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
const find=(tree,type)=>nodes(tree).find(n=>n.type===type);
const flush=()=>new Promise(setImmediate);
test('payment blocks repeat clicks, preserves retry identity, and does not resubmit after success with refresh failure',async()=>{
 const app=setup();app.render();app.mount();await flush();let tree=app.render();find(tree,'input').props.onChange({target:{value:'25'}});tree=app.render();
 const submit=()=>find(tree,'form').props.onSubmit({preventDefault(){}});submit();submit();assert.equal(app.requests.length,1);
 tree=app.render();nodes(tree).find(n=>n.type==='button'&&n.props.children==='Cancel').props.onClick();assert.equal(app.closed,0);
 app.requests[0].reject(Error('network'));await flush();tree=app.render();assert.equal(find(tree,'input').props.disabled,true);
 find(tree,'form').props.onSubmit({preventDefault(){}});assert.equal(app.requests[1].args[2],app.requests[0].args[2]);assert.equal(app.requests[1].args[1],25);
 app.requests[1].resolve({booking_id:1,pending_amount:75});await flush();tree=app.render();assert.equal(find(tree,'form'),undefined);assert.equal(app.stored.size,0);
 assert.ok(nodes(tree).some(n=>n.props.role==='alert'&&JSON.stringify(n.props.children).includes('Payment saved')));
});
test('payment rejects amounts greater than balance without a request',async()=>{
 const app=setup();app.render();app.mount();await flush();let tree=app.render();find(tree,'input').props.onChange({target:{value:'101'}});tree=app.render();find(tree,'form').props.onSubmit({preventDefault(){}});await flush();assert.equal(app.requests.length,0);assert.ok(nodes(app.render()).some(n=>n.props.role==='alert'));
});
