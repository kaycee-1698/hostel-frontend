const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function setup(){
 const states=[],requests=[];let index=0,effect,cleanup;
 const jsx=(type,props)=>({type,props});
 const react={useState:initial=>{const key=index++;if(!(key in states))states[key]=typeof initial==='function'?initial():initial;return [states[key],next=>{states[key]=typeof next==='function'?next(states[key]):next;}];},useEffect:callback=>{effect=callback;}};
 const deps={react,'react/jsx-runtime':{jsx,jsxs:jsx},'@/lib/bookingFilters':{hostelToday:()=> '2026-10-18'},'@/lib/api':{getActivityLogs:(filters,signal)=>new Promise((resolve,reject)=>requests.push({filters,signal,resolve,reject}))}};
 const scope={exports:{},AbortController,Intl,require:name=>deps[name]};
 const source=fs.readFileSync(__dirname+'/../src/components/ActivityLogs/ActivityLogs.tsx','utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 return {requests,render:()=>{index=0;return scope.exports.default();},runEffect:()=>{cleanup?.();cleanup=effect();},dispose:()=>cleanup?.()};
}
function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
const find=(tree,type,text)=>nodes(tree).find(n=>n.type===type&&n.props.children===text);
const flush=()=>new Promise(setImmediate);
test('logs default to today, clear filters shows all history, and stale requests cannot replace it',async()=>{
 const app=setup();let tree=app.render();app.runEffect();assert.equal(app.requests[0].filters.period,'today');
 find(tree,'button','Clear filters / View all').props.onClick();tree=app.render();app.runEffect();
 assert.equal(app.requests[0].signal.aborted,true);assert.equal(app.requests[1].filters.period,'all');assert.equal(app.requests[1].filters.page,'1');
 app.requests[1].resolve({logs:[],total:0,page:1,pageSize:50});await flush();app.requests[0].reject(Error('stale'));await flush();
 tree=app.render();assert.equal(nodes(tree).some(n=>n.props.role==='alert'),false);assert.ok(find(tree,'p','No activity matches these filters.'));app.dispose();
});
test('logs show failures rather than a misleading empty result and offer retry',async()=>{
 const app=setup();app.render();app.runEffect();app.requests[0].reject(Error('Unable to load'));await flush();const tree=app.render();
 assert.ok(nodes(tree).some(n=>n.props.role==='alert'));assert.ok(find(tree,'button','Retry'));assert.equal(find(tree,'p','No activity matches these filters.'),undefined);app.dispose();
});
