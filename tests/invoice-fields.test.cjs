const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);if(!n||typeof n!=='object')return [];return [n,...nodes(n.props?.children)];}
function component(name){const jsx=(type,props)=>({type,props});const deps={react:{useState:v=>[v,()=>{}],useEffect:()=>{}},'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/api':{},'../Extras/ExtraForms':{control:'input'},'libphonenumber-js/max':require('libphonenumber-js/max')};const scope={exports:{},require:n=>deps[n],Intl};vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../src/components/Invoices/'+name+'.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,scope);return scope.exports.default;}
test('stay editor requires dates and whole guests, preserves selected beds while clearing count',()=>{
 const Stay=component('StayFields');let changed;const draft={guests:'3',stay_beds:[{bed_id:1,bed_name:'Bed 1',room_name:'Mixed dorm'}]};
 const tree=Stay({draft,onChange:v=>changed=v});assert.equal(nodes(tree).filter(n=>n.type==='select').length,3);
 assert.equal(nodes(tree).filter(n=>n.type==='select')[0].props.value,1);
 assert.ok(nodes(tree).filter(n=>n.type==='select'||n.type==='input').every(n=>n.props.required));
 const guests=nodes(tree).find(n=>n.type==='input'&&n.props.type==='number');assert.equal(guests.props.step,'1');
 guests.props.onChange({target:{value:''}});assert.equal(changed.guests,'');assert.equal('stay_beds' in changed,false);
 guests.props.onChange({target:{value:'1'}});assert.equal(changed.stay_beds.length,1);
});
test('phone defaults to IN, removes non-numeric input, and validates optional number',()=>{
 const Phone=component('PhoneField');let changed;
 const tree=Phone({draft:{customer_phone:''},onChange:v=>changed=v});assert.equal(nodes(tree).find(n=>n.type==='select').props.value,'IN');
 const field=nodes(tree).find(n=>n.type==='input');field.props.onChange({target:{value:'98765abc43210',setCustomValidity(){}}});assert.equal(changed.customer_phone,'+919876543210');
 assert.equal(field.props.pattern,'[0-9]+');assert.equal(field.props.maxLength,undefined);
 field.props.onChange({target:{value:'123'}});assert.equal(changed.customer_phone,'+91123');
});
