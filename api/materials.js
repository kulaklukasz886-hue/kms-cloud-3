const SUPABASE_URL=process.env.SUPABASE_URL;
const SUPABASE_KEY=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
function headers(){return {apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation'}}
async function sb(path,options={}){
 if(!SUPABASE_URL||!SUPABASE_KEY) throw new Error('Brak SUPABASE_URL lub SUPABASE_ANON_KEY.');
 const res=await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:headers()});
 const text=await res.text(); let data=null; try{data=text?JSON.parse(text):null}catch{data=text}
 if(!res.ok) throw new Error(data?.message||text||'Supabase error'); return data;
}
export default async function handler(req,res){
 try{
  if(req.method==='GET') return res.status(200).json({ok:true,data:await sb('materials?select=*')});
  if(req.method==='POST') return res.status(200).json({ok:true,data:await sb('materials',{method:'POST',body:JSON.stringify(req.body)})});
  return res.status(405).json({ok:false,error:'Only GET and POST allowed'});
 }catch(e){return res.status(500).json({ok:false,error:e.message})}
}
