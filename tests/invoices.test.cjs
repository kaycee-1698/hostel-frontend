const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);if(!n||typeof n!=='object')return [];return [n,...nodes(n.props?.children)];}
test('invoice issue uses one request identity across double clicks and network retries',async()=>{
 const states=[],refs=[],requests=[],storage=new Map();let i=0,j=0,downloads=0;
 const jsx=(type,props)=>({type,props});const react={useState:v=>{const k=i++;if(!(k in states))states[k]=typeof v==='function'?v():v;return [states[k],v=>states[k]=typeof v==='function'?v(states[k]):v];},useRef:v=>refs[j++]??(refs[j-1]={current:v}),useEffect:()=>{}};
 const deps={react,'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/bookingFilters':{hostelToday:()=> '2026-10-20'},'@/lib/api':{issueInvoice:input=>new Promise((resolve,reject)=>requests.push({input,resolve,reject})),downloadInvoice:async()=>{downloads++;}},'./StayFields':{default:'StayFields'},'./PhoneField':{default:'PhoneField'},'../Dashboard/FindBookingModal':{default:'Search'},'../Extras/ExtraForms':{control:'input',money:n=>String(n)}};
 const scope={exports:{},require:n=>deps[n],crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},sessionStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{confirm:()=>true}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../src/components/Invoices/Invoices.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 const render=()=>{i=j=0;return scope.exports.default();};let tree=render();nodes(tree).find(n=>n.type==='button'&&n.props.children==='Manual invoice').props.onClick();tree=render();
 assert.equal(nodes(tree).find(n=>n.type==='input'&&n.props.max==='100').props.value,5);
 assert.equal(nodes(tree).filter(n=>n.type==='StayFields').length,1);
 assert.equal(nodes(tree).filter(n=>n.type==='PhoneField').length,1);
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='+ Add item').props.onClick();tree=render();
 const basis=nodes(tree).filter(n=>n.type==='select'&&['inclusive','exclusive'].includes(n.props.value));assert.equal(basis[0].props.value,'exclusive');assert.equal(basis[1].props.value,'inclusive');
 assert.equal(nodes(tree).filter(n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]==='Discount after tax (₹)').length,1);
 const numberFields=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='number');
 for(let index=0;index<numberFields.length;index++){
  let field=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='number')[index];const original=field.props.value;
  field.props.onChange({target:{valueAsNumber:NaN}});tree=render();
  field=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='number')[index];assert.equal(field.props.value,'');
  assert.equal(nodes(tree).some(n=>typeof n.props?.value==='number'&&Number.isNaN(n.props.value)),false);
  nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(requests.length,0);
  field.props.onChange({target:{valueAsNumber:original}});tree=render();
 }
 const submit=()=>nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});submit();submit();assert.equal(requests.length,1);assert.equal(requests[0].input.booking_id,null);
 requests[0].reject(Error('Network unavailable'));await new Promise(setImmediate);tree=render();assert.equal(nodes(tree).find(n=>n.type==='fieldset').props.disabled,true);submit();assert.equal(requests[1].input.request_id,requests[0].input.request_id);requests[1].resolve({invoice_id:'id',invoice_number:'UH/26-27/00001'});await new Promise(setImmediate);assert.equal(storage.size,0);assert.equal(downloads,1);
});
