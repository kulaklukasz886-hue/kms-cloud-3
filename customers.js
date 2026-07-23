import {sendCors} from './_auth.js';
export default async function handler(req,res){
 sendCors(res,'GET,OPTIONS'); if(req.method==='OPTIONS')return res.status(200).json({ok:true});
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'Only GET allowed'});
 const url=process.env.SUPABASE_URL||''; const anon=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'';
 if(!url||!anon)return res.status(500).json({ok:false,error:'Brak SUPABASE_URL lub klucza publicznego.'});
 return res.status(200).json({ok:true,url,anonKey:anon});
}
