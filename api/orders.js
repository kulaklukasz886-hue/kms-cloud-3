function env(name){ return process.env[name] || ''; }

const SUPABASE_URL = env('SUPABASE_URL');
const SUPABASE_KEY = env('SUPABASE_ANON_KEY') || env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_PUBLISHABLE_KEY');

function sendCors(res){
  res.setHeader('Access-Control-Allow-Credentials','true');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, apikey');
}
function headers(extra={}){return{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation',...extra};}
async function sb(path,options={}){
  if(!SUPABASE_URL||!SUPABASE_KEY)throw new Error('Brak SUPABASE_URL lub SUPABASE_ANON_KEY w Vercel Environment Variables.');
  const url=`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`;
  const res=await fetch(url,{...options,headers:headers(options.headers||{})});
  const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!res.ok)throw new Error(data?.message||data?.error||text||`Supabase HTTP ${res.status}`);
  return data;
}
function safeArray(v){return Array.isArray(v)?v:[]}
function mapMaterial(orderId,m){return{order_id:orderId,type:String(m.type||''),material:String(m.material||''),quantity:Number(m.qty??m.quantity??0)||0,unit:String(m.unit||''),supplier:String(m.producer||m.supplier||m.glassSupplier||''),status:String(m.status||'Do zamówienia'),related_type:String(m.relatedType||m.related_type||'')}}
function mapTask(orderId,t){return{order_id:orderId,station:String(t.station||t.name||t.task_name||'Produkcja'),task_name:String(t.name||t.task_name||t.station||'Zadanie'),status:String(t.status||'Do wykonania'),source:String(t.source||''),qty:Number(t.qty??0)||0,unit:String(t.unit||''),notes:String(t.notes||'')}}
function mapFile(orderId,f){return{order_id:orderId,file_name:String(f.name||f.file_name||'plik'),file_url:String(f.url||f.file_url||''),station:String(f.station||'Zamówienie'),file_type:String(f.file_type||'')}}
async function loadChildren(orders){
  const ids=orders.map(o=>o.id).filter(Boolean); if(!ids.length)return orders;
  const inList=`(${ids.join(',')})`;let materials=[],tasks=[],files=[];
  try{materials=await sb(`materials?order_id=in.${inList}&select=*`)}catch(e){console.error('materials load',e)}
  try{tasks=await sb(`tasks?order_id=in.${inList}&select=*`)}catch(e){console.error('tasks load',e)}
  try{files=await sb(`files?order_id=in.${inList}&select=*`)}catch(e){console.error('files load',e)}
  return orders.map(o=>({...o,materials:safeArray(materials).filter(x=>x.order_id===o.id),tasks:safeArray(tasks).filter(x=>x.order_id===o.id),files:safeArray(files).filter(x=>x.order_id===o.id)}));
}
async function deleteChildren(orderId){
  await sb(`materials?order_id=eq.${orderId}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
  await sb(`tasks?order_id=eq.${orderId}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
  await sb(`files?order_id=eq.${orderId}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
}
async function insertChildren(orderId,order){
  const mats=safeArray(order.materials).map(m=>mapMaterial(orderId,m));
  const tasks=safeArray(order.tasks).map(t=>mapTask(orderId,t));
  const files=safeArray(order.docs).map(f=>mapFile(orderId,f));
  if(mats.length)await sb('materials',{method:'POST',body:JSON.stringify(mats)});
  if(tasks.length)await sb('tasks',{method:'POST',body:JSON.stringify(tasks)});
  if(files.length)await sb('files',{method:'POST',body:JSON.stringify(files)});
  return{materials:mats.length,tasks:tasks.length,files:files.length};
}
async function rollbackOrder(orderId){if(!orderId)return;try{await sb(`orders?id=eq.${orderId}`,{method:'DELETE'})}catch(e){console.error('rollback failed',e)}}
export default async function handler(req,res){
  sendCors(res);
  if(req.method==='OPTIONS')return res.status(200).json({ok:true});
  try{
    if(req.method==='GET'){
      const rows=await sb('orders?select=*&order=created_at.desc');
      return res.status(200).json({ok:true,orders:await loadChildren(safeArray(rows))});
    }
    if(req.method==='POST'){
      const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      const order=body.order||body;
      const payload={order_number:String(order.orderNo||order.order_number||'').trim()||'BEZ NUMERU',customer:String(order.client||order.customer||'').trim(),status:String(order.status||'NOWE'),amount:order.amount?String(order.amount):null,deadline:order.deadline||null,data:order};
      const inserted=await sb('orders',{method:'POST',body:JSON.stringify(payload)});
      const row=Array.isArray(inserted)?inserted[0]:inserted; const orderId=row.id;
      try{const counts=await insertChildren(orderId,order);return res.status(200).json({ok:true,order:row,counts});}
      catch(childError){await rollbackOrder(orderId);throw new Error('Zlecenie cofnięte. Błąd zapisu materiałów/zadań/plików: '+childError.message);}
    }
    if(req.method==='PUT'){
      const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      const order=body.order||body; const orderId=order.cloudId||order.id;
      if(!orderId)throw new Error('Brak ID zlecenia do aktualizacji.');
      const payload={order_number:String(order.orderNo||order.order_number||'').trim()||'BEZ NUMERU',customer:String(order.client||order.customer||'').trim(),status:String(order.status||'NOWE'),amount:order.amount?String(order.amount):null,deadline:order.deadline||null,data:order};
      const updated=await sb(`orders?id=eq.${orderId}`,{method:'PATCH',body:JSON.stringify(payload)});
      await deleteChildren(orderId);
      const counts=await insertChildren(orderId,order);
      const row=Array.isArray(updated)?updated[0]:updated;
      return res.status(200).json({ok:true,order:row,counts});
    }
    return res.status(405).json({ok:false,error:`Method ${req.method} not allowed. Allowed: GET, POST, PUT, OPTIONS.`});
  }catch(e){console.error(e);return res.status(500).json({ok:false,error:e.message||'Błąd API orders'});}
}
