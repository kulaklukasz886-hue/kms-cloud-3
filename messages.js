import {sendCors,requireAuth,fail} from './_auth.js';
export default async function handler(req,res){
 sendCors(res,'GET,OPTIONS'); if(req.method==='OPTIONS')return res.status(200).json({ok:true});
 try{if(req.method!=='GET')return res.status(405).json({ok:false,error:'Only GET allowed'});const ctx=await requireAuth(req);return res.status(200).json({ok:true,user:{id:ctx.user.id,email:ctx.user.email},profile:ctx.profile})}
 catch(e){return fail(res,e,'Błąd profilu')}
}
