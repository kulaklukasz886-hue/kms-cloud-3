const SUPABASE_URL=process.env.SUPABASE_URL||'';
const PUBLIC_KEY=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||'';
const DB_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||PUBLIC_KEY;

export function sendCors(res,methods='GET,POST,PUT,DELETE,OPTIONS'){
  res.setHeader('Access-Control-Allow-Credentials','true');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods',methods);
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, apikey');
}
function bearer(req){
  const h=String(req.headers?.authorization||'');
  return h.startsWith('Bearer ')?h.slice(7).trim():'';
}
async function jsonFetch(url,options={}){
  const r=await fetch(url,options); const text=await r.text(); let data=null;
  try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.error||text||`HTTP ${r.status}`);
  return data;
}
export async function requireAuth(req,allowedRoles=[]){
  if(!SUPABASE_URL||!PUBLIC_KEY)throw Object.assign(new Error('Brak konfiguracji Supabase Auth.'),{status:500});
  const token=bearer(req);
  if(!token)throw Object.assign(new Error('Wymagane logowanie.'),{status:401});
  let user;
  try{
    user=await jsonFetch(`${SUPABASE_URL.replace(/\/$/,'')}/auth/v1/user`,{headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${token}`}});
  }catch(e){throw Object.assign(new Error('Sesja wygasła. Zaloguj się ponownie.'),{status:401})}
  let rows=[];
  try{
    rows=await db(`profiles?id=eq.${encodeURIComponent(user.id)}&select=id,email,full_name,role,active`,{},token);
  }catch(e){throw Object.assign(new Error('Brak profilu użytkownika. Administrator musi przypisać rolę.'),{status:403})}
  const profile=Array.isArray(rows)?rows[0]:null;
  if(!profile||profile.active===false)throw Object.assign(new Error('Konto nieaktywne lub bez przypisanej roli.'),{status:403});
  const role=String(profile.role||'').toUpperCase();
  if(allowedRoles.length&&!allowedRoles.map(x=>x.toUpperCase()).includes(role)){
    throw Object.assign(new Error('Brak uprawnień do tej operacji.'),{status:403});
  }
  return{token,user,profile:{...profile,role}};
}
export async function db(path,options={},userToken=''){
  if(!SUPABASE_URL||!DB_KEY)throw new Error('Brak konfiguracji Supabase.');
  const key=DB_KEY;
  const auth=process.env.SUPABASE_SERVICE_ROLE_KEY?key:(userToken||key);
  const r=await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`,{
    ...options,
    headers:{apikey:key,Authorization:`Bearer ${auth}`,'Content-Type':'application/json',Prefer:'return=representation',...(options.headers||{})}
  });
  const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok)throw new Error(data?.message||data?.error||text||`Supabase HTTP ${r.status}`);
  return data;
}
export async function audit(ctx,action,entityType='',entityId='',details={}){
  try{
    await db('audit_logs',{method:'POST',body:JSON.stringify({
      user_id:ctx.user.id,user_email:ctx.user.email||ctx.profile.email||'',user_name:ctx.profile.full_name||'',role:ctx.profile.role,
      action,entity_type:entityType,entity_id:String(entityId||''),details
    })},ctx.token);
  }catch(e){console.error('audit',e.message)}
}
export function fail(res,e,label='Błąd API'){
  const status=Number(e?.status)||500;
  return res.status(status).json({ok:false,error:e?.message||label});
}
