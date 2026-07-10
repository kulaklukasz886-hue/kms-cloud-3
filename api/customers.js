function env(name){return process.env[name]||''}
const SUPABASE_URL=env('SUPABASE_URL');
const SUPABASE_KEY=env('SUPABASE_ANON_KEY')||env('SUPABASE_SERVICE_ROLE_KEY')||env('SUPABASE_PUBLISHABLE_KEY');
function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, apikey')}
function headers(extra={}){return{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation',...extra}}
async function sb(path,options={}){
 if(!SUPABASE_URL||!SUPABASE_KEY)throw new Error('Brak konfiguracji Supabase.');
 const res=await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:headers(options.headers||{})});
 const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
 if(!res.ok)throw new Error(data?.message||data?.error||text||`Supabase HTTP ${res.status}`);return data
}
function payload(c){return{name:String(c.name||'').trim(),email:String(c.email||'').trim()||null,phone:String(c.phone||'').trim()||null,contact_person:String(c.contact_person||'').trim()||null,nip:String(c.nip||'').trim()||null,notes:String(c.notes||'').trim()||null,updated_at:new Date().toISOString()}}
export default async function handler(req,res){
 cors(res);if(req.method==='OPTIONS')return res.status(200).json({ok:true});
 try{
  if(req.method==='GET'){const rows=await sb('customers?select=*&order=name.asc');return res.status(200).json({ok:true,customers:Array.isArray(rows)?rows:[]})}
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),c=body.customer||body;
  if(req.method==='POST'){const rows=await sb('customers',{method:'POST',body:JSON.stringify(payload(c))});return res.status(200).json({ok:true,customer:Array.isArray(rows)?rows[0]:rows})}
  if(req.method==='PUT'){if(!c.id)throw new Error('Brak ID klienta.');const rows=await sb(`customers?id=eq.${c.id}`,{method:'PATCH',body:JSON.stringify(payload(c))});return res.status(200).json({ok:true,customer:Array.isArray(rows)?rows[0]:rows})}
  return res.status(405).json({ok:false,error:'Only GET, POST, PUT, OPTIONS allowed'});
 }catch(e){console.error(e);return res.status(500).json({ok:false,error:e.message||'Błąd API customers'})}
}
