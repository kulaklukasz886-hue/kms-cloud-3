import {sendCors,requireAuth,fail} from './_auth.js';
import formidable from 'formidable';
import fs from 'fs/promises';
import OpenAI from 'openai';

export const config = { api: { bodyParser: false } };
function parseForm(req){const form=formidable({multiples:false,maxFileSize:25*1024*1024});return new Promise((resolve,reject)=>form.parse(req,(err,fields,files)=>err?reject(err):resolve({fields,files})))}
function first(v){return Array.isArray(v)?v[0]:v}
function dataUrl(mime,b64){return `data:${mime||'application/octet-stream'};base64,${b64}`}

const edge={type:'string',enum:['','1MM','2MM']};
const schema={type:'object',additionalProperties:false,properties:{
 orderNo:{type:'string'},client:{type:'string'},rawSummary:{type:'string'},notes:{type:'string'},confidence:{type:'number'},
 items:{type:'array',items:{type:'object',additionalProperties:false,properties:{
  element:{type:'string'},material:{type:'string'},length:{type:'number'},width:{type:'number'},qty:{type:'number'},thickness:{type:'number'},
  edge1:edge,edge2:edge,edge3:edge,edge4:edge,pcvCode:{type:'string'},technology:{type:'string',enum:['STANDARD','36MM','ZBIORCZY_2','28MM','FRONTY_SLOJ','LAMELE','INNE']},info:{type:'string'},notes:{type:'string'},confidence:{type:'number'},uncertain:{type:'boolean'}
 },required:['element','material','length','width','qty','thickness','edge1','edge2','edge3','edge4','pcvCode','technology','info','notes','confidence','uncertain']}}
},required:['orderNo','client','rawSummary','notes','confidence','items']};

export default async function handler(req,res){
 sendCors(res,'GET,POST,OPTIONS');if(req.method==='OPTIONS')return res.status(200).json({ok:true});
 try{await requireAuth(req,['ADMIN','BIURO']);}catch(e){return fail(res,e,'Brak dostępu do analizy zamówień');}
 if(req.method==='GET')return res.status(200).json({ok:true,message:'KMS Analiza Zamówień 1→2→3 działa. Użyj POST z plikiem.'});
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Only GET and POST allowed'});
 try{
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({ok:false,error:'Brak OPENAI_API_KEY w Vercel Environment Variables.'});
  const {fields,files}=await parseForm(req);const file=first(files.file);if(!file)return res.status(400).json({ok:false,error:'Brak pliku.'});
  const bytes=await fs.readFile(file.filepath);const mime=file.mimetype||'application/octet-stream';
  const part=mime==='application/pdf'?{type:'input_file',filename:file.originalFilename||'zamowienie.pdf',file_data:dataUrl(mime,bytes.toString('base64'))}:{type:'input_image',image_url:dataUrl(mime,bytes.toString('base64'))};
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const prompt=`Jesteś modułem KMS — ETAP 1: wierne mapowanie zamówienia klienta z odręcznej rozpiski, zdjęcia lub PDF.

NADRZĘDNE ZASADY:
1. Przepisz dane 1:1. Na Etapie 1 nie stosuj zmian technologicznych i nie poprawiaj wymiarów klienta.
2. Zachowaj pełny symbol materiału dokładnie tak, jak jest zapisany. Nie skracaj i nie zgaduj dekoru.
3. Długość zapisuj jako pierwszy wymiar, szerokość jako drugi. Wszystkie wymiary w mm.
4. Ilość, grubość i każdą krawędź do oklejania odczytaj oddzielnie.
5. Kreska przy wymiarze oznacza krawędź tego wymiaru do oklejenia: jedna kreska = jedna krawędź, dwie kreski = dwie. Brak kreski = brak oklejania.
6. Rozpoznaj 1MM albo 2MM tylko wtedy, gdy jest to widoczne. Nieznane pole pozostaw puste i ustaw uncertain=true.
7. Nie wymyślaj kodu PCV. Przepisz go tylko, gdy występuje.
8. technology jest jedynie sugestią do późniejszej kontroli: 36MM, 28MM, element zbiorczy, fronty ze słojem, lamele, inne; nie przeliczaj jeszcze wymiarów.
9. Jeżeli cokolwiek jest nieczytelne, wpisz 0 lub pusty tekst, opisz problem w notes, ustaw uncertain=true i obniż confidence.
10. Każdy osobny wiersz/element zamówienia zwróć jako osobną pozycję.

Dane podane przez pracownika (mogą być puste): nr zlecenia: ${first(fields.orderNo)||''}; klient: ${first(fields.client)||''}.
Zwróć wyłącznie JSON zgodny ze schematem.`;
  const response=await client.responses.create({model:process.env.OPENAI_MODEL||'gpt-4o-mini',input:[{role:'user',content:[{type:'input_text',text:prompt},part]}],text:{format:{type:'json_schema',name:'kms_order_stage1',schema,strict:true}}});
  return res.status(200).json(JSON.parse(response.output_text));
 }catch(e){console.error(e);return res.status(500).json({ok:false,error:e.message||'Błąd analizy AI',details:'Sprawdź OPENAI_API_KEY, model i logi Vercel.'})}
}
