const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function setup(kind='sale'){const states=[],refs=[],requests=[],storage=new Map();let index=0,refIndex=0,saved=0;
 const jsx=(type,props)=>({type,props});const react={useState:initial=>{const key=index++;if(!(key in states))states[key]=typeof initial==='function'?initial():initial;return [states[key],value=>{states[key]=typeof value==='function'?value(states[key]):value;}];},useRef:initial=>refs[refIndex++]??(refs[refIndex-1]={current:initial}),useEffect:()=>{}};
 const deps={react,'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/bookingFilters':{hostelToday:()=> '2026-10-19'},'@/lib/api':{collectExtraPayment:(id,input)=>new Promise((resolve,reject)=>requests.push({id,input,resolve,reject})),recordExtraSale:input=>new Promise((resolve,reject)=>requests.push({input,resolve,reject}))},'../Modal/Modal':{default:'Modal'}};
 const scope={exports:{},Intl,require:name=>deps[name],crypto:{randomUUID:()=> 'request-1'},sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../src/components/Extras/ExtraForms.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 return {requests,storage,get saved(){return saved;},render(){index=refIndex=0;return kind==='collect'?scope.exports.CollectExtraForm({sale:{sale_id:'sale-1',total:100,paid_amount:20,item_name:'Toiletries'},onClose(){},onSaved(){saved++;}}):scope.exports.SaleForm({items:[{item_id:1,name:'Towel',category:'Service',price:50,active:true},{item_id:2,name:'Dental kit',category:'Toiletries',price:30,active:true},{item_id:3,name:'Shampoo',category:'Toiletries',price:20,active:true}],onClose(){},onSaved(){saved++;}});}};
}
function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
const flush=()=>new Promise(setImmediate);
test('extras fills item price, records quantity and blocks duplicate submissions',async()=>{
 const app=setup();let tree=app.render();nodes(tree).find(n=>n.type==='select').props.onChange({target:{value:'1'}});tree=app.render();
 const numbers=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='number');assert.equal(numbers[1].props.value,'50');numbers[0].props.onChange({target:{value:'2'}});tree=app.render();
 const submit=()=>nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});submit();submit();assert.equal(app.requests.length,1);assert.equal(app.requests[0].input.lines[0].unit_price,50);assert.equal(app.requests[0].input.lines[0].quantity,2);
 app.requests[0].reject(Error('Connection lost'));await flush();tree=app.render();assert.equal(nodes(tree).find(n=>n.type==='fieldset').props.disabled,true);
 nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(app.requests[1].input.request_id,app.requests[0].input.request_id);app.requests[1].resolve({});await flush();assert.equal(app.saved,1);assert.equal(app.storage.size,0);
});
test('extras will not submit an empty item or fractional quantity',async()=>{
 const app=setup();let tree=app.render();nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(app.requests.length,0);
 nodes(tree).find(n=>n.type==='select').props.onChange({target:{value:'1'}});tree=app.render();nodes(tree).find(n=>n.type==='input'&&n.props.type==='number').props.onChange({target:{value:'1.5'}});tree=app.render();nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(app.requests.length,0);
});

test('toiletries combine multiple products into one paid sale',()=>{
 const app=setup();let tree=app.render();nodes(tree).find(n=>n.type==='select').props.onChange({target:{value:'toiletries'}});tree=app.render();
 const checks=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='checkbox');checks[0].props.onChange({target:{checked:true}});checks[1].props.onChange({target:{checked:true}});tree=app.render();
 nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(app.requests.length,1);assert.equal(app.requests[0].input.lines.length,2);assert.equal(app.requests[0].input.paid,true);assert.equal(app.requests[0].input.lines.reduce((sum,l)=>sum+l.quantity*l.unit_price,0),50);
});
test('unpaid sales require an identifiable customer and preserve unpaid status',()=>{
 const app=setup();let tree=app.render();nodes(tree).find(n=>n.type==='select').props.onChange({target:{value:'1'}});tree=app.render();
 nodes(tree).find(n=>n.type==='select'&&n.props.value==='paid').props.onChange({target:{value:'unpaid'}});tree=app.render();nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(app.requests.length,0);
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='No booking? Enter customer name').props.onClick();tree=app.render();
 nodes(tree).find(n=>n.type==='input'&&n.props.maxLength===100).props.onChange({target:{value:'Walk-in customer'}});tree=app.render();nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(app.requests.length,1);assert.equal(app.requests[0].input.paid,false);assert.equal(app.requests[0].input.customer_name,'Walk-in customer');
});

test('extras collection supports partial payment and retries the same receipt after uncertainty',async()=>{
 const app=setup('collect');let tree=app.render();nodes(tree).find(n=>n.type==='input').props.onChange({target:{value:'30'}});tree=app.render();const submit=()=>nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});submit();submit();assert.equal(app.requests.length,1);assert.equal(app.requests[0].input.amount,30);
 app.requests[0].reject(Error('Connection lost'));await flush();tree=app.render();assert.equal(nodes(tree).find(n=>n.type==='fieldset').props.disabled,true);nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(app.requests[1].input.request_id,app.requests[0].input.request_id);app.requests[1].resolve({});await flush();assert.equal(app.saved,1);assert.equal(app.storage.size,0);
});
