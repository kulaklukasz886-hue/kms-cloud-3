import {sendCors,requireAuth,db,audit,fail} from './_auth.js';
const ALL=['ADMIN','BIURO','KOORDYNACJA','PILA','OKLEINIARKA','CNC','MONTAZ','PRODUKCJA'];
const CREATE=['ADMIN','BIURO'];
function safeArray(v){return Array.isArray(v)?v:[]}
function mapMaterial(orderId,m){return{order_id:orderId,type:String(m.type||''),material:String(m.material||''),quantity:Number(m.qty??m.quantity??0)||0,unit:String(m.unit||''),supplier:String(m.assignedSupplier||m.supplierOverride||m.producer||m.supplier||m.glassSupplier||''),status:String(m.status||'Do zamówienia'),related_type:String(m.relatedType||m.related_type||'')}}
function mapTask(orderId,t){return{order_id:orderId,station:String(t.station||t.name||t.task_name||'Produkcja'),task_name:String(t.name||t.task_name||t.station||'Zadanie'),status:String(t.status||'Do wykonania'),source:String(t.source||''),qty:Number(t.qty??0)||0,unit:String(t.unit||''),notes:String(t.notes||'')}}
function mapFile(orderId,f){return{order_id:orderId,file_name:String(f.name||f.file_name||'plik'),file_url:String(f.url||f.file_url||''),station:String(f.station||'Zamówienie'),file_type:String(f.fileType||f.file_type||'')}}
async function loadChildren(orders,ctx){const ids=orders.map(o=>o.id).filter(Boolean);if(!ids.length)return orders;const list=`(${ids.join(',')})`;let materials=[],tasks=[],files=[];try{materials=await db(`materials?order_id=in.${list}&select=*`,{},ctx.token)}catch(e){console.error(e)}try{tasks=await db(`tasks?order_id=in.${list}&select=*`,{},ctx.token)}catch(e){console.error(e)}try{files=await db(`files?order_id=in.${list}&select=*`,{},ctx.token)}catch(e){console.error(e)}return orders.map(o=>({...o,materials:safeArray(materials).filter(x=>x.order_id===o.id),tasks:safeArray(tasks).filter(x=>x.order_id===o.id),files:safeArray(files).filter(x=>x.order_id===o.id)}))}
async function deleteChildren(id,ctx){for(const t of ['materials','tasks','files'])await db(`${t}?order_id=eq.${id}`,{method:'DELETE',headers:{Prefer:'return=minimal'}},ctx.token)}
async function insertChildren(id,o,ctx){const mats=safeArray(o.materials).map(m=>mapMaterial(id,m)),tasks=safeArray(o.tasks).map(t=>mapTask(id,t)),files=safeArray(o.docs).map(f=>mapFile(id,f));if(mats.length)await db('materials',{method:'POST',body:JSON.stringify(mats)},ctx.token);if(tasks.length)await db('tasks',{method:'POST',body:JSON.stringify(tasks)},ctx.token);if(files.length)await db('files',{method:'POST',body:JSON.stringify(files)},ctx.token);return{materials:mats.length,tasks:tasks.length,files:files.length}}
function payload(o,ctx){const data={...o,docs:[],lastChangedBy:ctx.profile.full_name||ctx.user.email,lastChangedById:ctx.user.id,lastChangedAt:new Date().toISOString()};return{order_number:String(o.orderNo||o.order_number||'').trim()||'BEZ NUMERU',customer:String(o.client||o.customer||'').trim(),status:String(o.status||'NOWE'),amount:o.amount?String(o.amount):null,deadline:o.deadline||null,data}}
async function guardNoteDeletion(id,o,ctx){
  if(String(ctx.profile?.role||'').toUpperCase()==='ADMIN')return;
  const rows=await db(`orders?id=eq.${encodeURIComponent(id)}&select=id,data`,{},ctx.token);
  const existing=Array.isArray(rows)?rows[0]:null;
  const oldNote=String(existing?.data?.note||'').trim();
  const newNote=String(o?.note||'').trim();
  if(oldNote&&!newNote){
    throw Object.assign(new Error('Tylko administrator może usunąć notatkę ze zlecenia.'),{status:403});
  }
}
export default async function handler(req,res){sendCors(res);if(req.method==='OPTIONS')return res.status(200).json({ok:true});try{
 const roles=req.method==='POST'?CREATE:req.method==='DELETE'?['ADMIN']:ALL;const ctx=await requireAuth(req,roles);
 if(req.method==='GET'){const rows=await db('orders?select=*&order=created_at.desc',{},ctx.token);return res.status(200).json({ok:true,orders:await loadChildren(safeArray(rows),ctx)})}
 const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),o=body.order||body;
 if(req.method==='POST'){const ins=await db('orders',{method:'POST',body:JSON.stringify(payload(o,ctx))},ctx.token);const row=Array.isArray(ins)?ins[0]:ins;try{const counts=await insertChildren(row.id,o,ctx);await audit(ctx,'ORDER_CREATE','order',row.id,{orderNo:o.orderNo});return res.status(200).json({ok:true,order:row,counts})}catch(e){await db(`orders?id=eq.${row.id}`,{method:'DELETE'},ctx.token);throw e}}
 if(req.method==='PUT'){const id=o.cloudId||o.id;if(!id)throw new Error('Brak ID zlecenia.');await guardNoteDeletion(id,o,ctx);const upd=await db(`orders?id=eq.${id}`,{method:'PATCH',body:JSON.stringify(payload(o,ctx))},ctx.token);await deleteChildren(id,ctx);const counts=await insertChildren(id,o,ctx);await audit(ctx,'ORDER_UPDATE','order',id,{orderNo:o.orderNo,reason:body.reason||''});return res.status(200).json({ok:true,order:Array.isArray(upd)?upd[0]:upd,counts})}
 if(req.method==='DELETE'){const id=body.id||body.orderId;if(!id)throw new Error('Brak ID zlecenia.');await deleteChildren(id,ctx);await db(`orders?id=eq.${id}`,{method:'DELETE',headers:{Prefer:'return=minimal'}},ctx.token);await audit(ctx,'ORDER_DELETE','order',id,{});return res.status(200).json({ok:true})}
 return res.status(405).json({ok:false,error:'Method not allowed'});
 }catch(e){return fail(res,e,'Błąd API orders')}}
