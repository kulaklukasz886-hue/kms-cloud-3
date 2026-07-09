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
  if(!SUPABASE_URL||!SUPABASE_KEY)throw new Error('Brak SUPABASE_URL lub SUPABASE_ANON_KEY.');
  const url=`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`;
  const res=await fetch(url,{...options,headers:headers(options.headers||{})});
  const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!res.ok)throw new Error(data?.message||data?.error||text||`Supabase HTTP ${res.status}`);
  return data;
}
function payloadFrom(m){
  return {
    order_id: m.orderId || m.order_id || null,
    order_number: String(m.orderNo || m.order_number || ''),
    customer: String(m.client || m.customer || ''),
    station: String(m.station || 'Inne'),
    priority: String(m.priority || 'Normalne'),
    message: String(m.text || m.message || ''),
    answer: String(m.answer || ''),
    status: String(m.status || 'Otwarte'),
    closed_at: m.status==='Zamknięte' ? new Date().toISOString() : null
  };
}
export default async function handler(req,res){
  sendCors(res);
  if(req.method==='OPTIONS')return res.status(200).json({ok:true});
  try{
    if(req.method==='GET'){
      const rows=await sb('messages?select=*&order=created_at.desc');
      return res.status(200).json({ok:true,messages:Array.isArray(rows)?rows:[]});
    }
    if(req.method==='POST'){
      const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      const m=body.message||body;
      const inserted=await sb('messages',{method:'POST',body:JSON.stringify(payloadFrom(m))});
      const row=Array.isArray(inserted)?inserted[0]:inserted;
      return res.status(200).json({ok:true,message:row});
    }
    if(req.method==='PUT'){
      const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      const m=body.message||body;
      const id=m.cloudId||m.id;
      if(!id)throw new Error('Brak ID komunikatu.');
      const updated=await sb(`messages?id=eq.${id}`,{method:'PATCH',body:JSON.stringify(payloadFrom(m))});
      const row=Array.isArray(updated)?updated[0]:updated;
      return res.status(200).json({ok:true,message:row});
    }
    return res.status(405).json({ok:false,error:'Only GET, POST, PUT, OPTIONS allowed'});
  }catch(e){
    console.error(e);
    return res.status(500).json({ok:false,error:e.message||'Błąd API messages'});
  }
}
