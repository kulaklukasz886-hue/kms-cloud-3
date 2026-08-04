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
  edge1:edge,edge2:edge,edge3:edge,edge4:edge,pcvCode:{type:'string'},technology:{type:'string',enum:['STANDARD','10MM','16MM','36MM','ZBIORCZY_2','28MM','FRONTY_SLOJ','LAMELE','INNE']},info:{type:'string'},notes:{type:'string'},confidence:{type:'number'},uncertain:{type:'boolean'}
 },required:['element','material','length','width','qty','thickness','edge1','edge2','edge3','edge4','pcvCode','technology','info','notes','confidence','uncertain']}}
},required:['orderNo','client','rawSummary','notes','confidence','items']};
const pcvAuditSchema={type:'object',additionalProperties:false,properties:{
 globalPcv:{type:'string',enum:['','1MM','2MM']},
 globalPcvUncertain:{type:'boolean'},
 notes:{type:'string'},
 rows:{type:'array',items:{type:'object',additionalProperties:false,properties:{
  row:{type:'number'},
  length:{type:'number'},
  width:{type:'number'},
  qty:{type:'number'},
  lengthMarks:{type:'number',enum:[0,1,2]},
  widthMarks:{type:'number',enum:[0,1,2]},
  uncertain:{type:'boolean'},
  notes:{type:'string'}
 },required:['row','length','width','qty','lengthMarks','widthMarks','uncertain','notes']}}
},required:['globalPcv','globalPcvUncertain','notes','rows']};


export default async function handler(req,res){
 sendCors(res,'GET,POST,OPTIONS');if(req.method==='OPTIONS')return res.status(200).json({ok:true});
 try{await requireAuth(req,['ADMIN','BIURO']);}catch(e){return fail(res,e,'Brak dostÄ™pu do analizy zamĂłwieĹ„');}
 if(req.method==='GET')return res.status(200).json({ok:true,message:'KMS Analiza ZamĂłwieĹ„ 1â†’2â†’3 dziaĹ‚a. UĹĽyj POST z plikiem.'});
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Only GET and POST allowed'});
 try{
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({ok:false,error:'Brak OPENAI_API_KEY w Vercel Environment Variables.'});
  const {fields,files}=await parseForm(req);const file=first(files.file);if(!file)return res.status(400).json({ok:false,error:'Brak pliku.'});
  const bytes=await fs.readFile(file.filepath);const mime=String(file.mimetype||'application/octet-stream').toLowerCase();
  const fileName=String(file.originalFilename||'zamowienie');
  const spreadsheetText=String(first(fields.spreadsheetText)||'').slice(0,120000);
  const isSpreadsheet=/\.(xlsx|xls|csv)$/i.test(fileName)||mime.includes('spreadsheet')||mime.includes('excel')||mime==='text/csv';
  let sourcePart=null;
  if(isSpreadsheet){
   if(!spreadsheetText.trim())return res.status(400).json({ok:false,error:'Nie udaĹ‚o siÄ™ odczytaÄ‡ treĹ›ci arkusza Excel/CSV w przeglÄ…darce.'});
  }else if(mime==='application/pdf'||/\.pdf$/i.test(fileName)){
   sourcePart={type:'input_file',filename:fileName,file_data:dataUrl(mime,bytes.toString('base64'))};
  }else if(mime.startsWith('image/')){
   sourcePart={type:'input_image',image_url:dataUrl(mime,bytes.toString('base64')),detail:'original'};
  }else{
   return res.status(400).json({ok:false,error:'ObsĹ‚ugiwane pliki: zdjÄ™cia, PDF, XLSX, XLS i CSV.'});
  }
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const prompt=`JesteĹ› moduĹ‚em KMS â€” ETAP 1: wierne mapowanie zamĂłwienia klienta z odrÄ™cznej rozpiski, zdjÄ™cia lub PDF.

NADRZÄDNE ZASADY:
1. Przepisz dane 1:1. Na Etapie 1 nie stosuj zmian technologicznych i nie poprawiaj wymiarĂłw klienta.
2. Zachowaj peĹ‚ny symbol materiaĹ‚u dokĹ‚adnie tak, jak jest zapisany. Nie skracaj i nie zgaduj dekoru.
3. DĹ‚ugoĹ›Ä‡ zapisuj jako pierwszy wymiar, szerokoĹ›Ä‡ jako drugi. Wszystkie wymiary w mm.
4. IloĹ›Ä‡, gruboĹ›Ä‡ i kaĹĽdÄ… krawÄ™dĹş do oklejania odczytaj oddzielnie.
5. Zapis â€ž2570 Ă— 800 Ă— 1â€ť oznacza: dĹ‚ugoĹ›Ä‡ 2570, szerokoĹ›Ä‡ 800, ILOĹšÄ† 1. Ostatnie â€žĂ—1â€ť, â€žĂ—2â€ť, â€žx1â€ť, â€žx2â€ť jest zawsze iloĹ›ciÄ… â€” NIGDY gruboĹ›ciÄ… PCV.
6. Kreski technologiczne mogÄ… byÄ‡ narysowane NAD, POD albo bezpoĹ›rednio przy cyfrze wymiaru. SÄ… czÄ™Ĺ›ciÄ… zamĂłwienia i muszÄ… byÄ‡ odczytane osobno dla kaĹĽdego wymiaru.
7. Pierwszy wymiar to dĹ‚ugoĹ›Ä‡:
   - jedna kreska przy pierwszym wymiarze = edge1,
   - dwie kreski przy pierwszym wymiarze = edge1 i edge2.
8. Drugi wymiar to szerokoĹ›Ä‡:
   - jedna kreska przy drugim wymiarze = edge3,
   - dwie kreski przy drugim wymiarze = edge3 i edge4.
9. OgĂłlna notatka â€žPCV 1MMâ€ť lub â€žPCV 2MMâ€ť okreĹ›la typ obrzeĹĽa. Zastosuj ten typ WYĹÄ„CZNIE do krawÄ™dzi wskazanych kreskami. Sama notatka PCV bez kresek nie tworzy ĹĽadnej krawÄ™dzi.
10. Brak kreski przy danym wymiarze oznacza brak oklejania na krawÄ™dziach tego wymiaru.
11. Ostatnie â€žĂ—1â€ť lub â€žĂ—2â€ť oznacza wyĹ‚Ä…cznie iloĹ›Ä‡ sztuk i nigdy nie moĹĽe zmieniÄ‡ PCV ani liczby kresek.
12. SzczegĂłlnie dokĹ‚adnie rozrĂłĹĽniaj rÄ™cznie zapisane cyfry 9, 8 i 5. Przed zwrĂłceniem wyniku wykonaj ponowne porĂłwnanie kaĹĽdej wartoĹ›ci zawierajÄ…cej 9 ze zdjÄ™ciem. Nie zamieniaj 90 na 80 ani 50. JeĹ›li znak pozostaje niepewny, ustaw uncertain=true zamiast zgadywaÄ‡.
13. GruboĹ›Ä‡ odczytaj wyĹ‚Ä…cznie wtedy, gdy jest jawnie podana przy materiale lub pozycji. Nie zakĹ‚adaj 18 mm dla zwykĹ‚ej pĹ‚yty. Gdy gruboĹ›ci nie ma albo jest nieczytelna, zwrĂłÄ‡ thickness=0, opisz brak w notes i ustaw uncertain=true. Oznaczenia 10MM, 16MM, 28MM, 36MM, BLAT 38MM i HPL 12MM sÄ… jawnÄ… gruboĹ›ciÄ…. Nie pobieraj gruboĹ›ci z koĹ„cowego x1/x2 ani z opisu PCV.
14. Nie wymyĹ›laj kodu PCV. Przepisz go tylko, gdy wystÄ™puje.
15. technology jest jedynie sugestiÄ… do pĂłĹşniejszej kontroli: 10MM, 16MM, 36MM, 28MM, element zbiorczy, fronty ze sĹ‚ojem, lamele, inne; nie przeliczaj jeszcze wymiarĂłw.
16. JeĹĽeli cokolwiek jest nieczytelne, wpisz 0 lub pusty tekst, opisz problem w notes, ustaw uncertain=true i obniĹĽ confidence.
17. KaĹĽdy osobny wiersz/element zamĂłwienia zwrĂłÄ‡ jako osobnÄ… pozycjÄ™.

Dane podane przez pracownika (mogÄ… byÄ‡ puste): nr zlecenia: ${first(fields.orderNo)||''}; klient: ${first(fields.client)||''}.
ZwrĂłÄ‡ wyĹ‚Ä…cznie JSON zgodny ze schematem.`;
  const content=[{type:'input_text',text:prompt}];
  if(isSpreadsheet)content.push({type:'input_text',text:`ĹąRĂ“DĹO: ARKUSZ EXCEL/CSV ${fileName}\nKolumny i wiersze zostaĹ‚y odczytane z pliku. Zachowaj kaĹĽdy wiersz 1:1.\n\n${spreadsheetText}`});
  else content.push(sourcePart);
  const model=process.env.OPENAI_MODEL||'gpt-5.6-sol';
  const response=await client.responses.create({model,input:[{role:'user',content}],text:{format:{type:'json_schema',name:'kms_order_stage1',schema,strict:true}}});
  let parsed=JSON.parse(response.output_text);

  // Drugi, niezaleĹĽny przebieg: wyĹ‚Ä…cznie wymiary kontrolne, rodzaj PCV i liczba kresek.
  let pcvAudit=null;
  if(!isSpreadsheet){
   const rowsForAudit=(parsed.items||[]).map((x,i)=>({
    row:i+1,
    length:Number(x.length)||0,
    width:Number(x.width)||0,
    qty:Number(x.qty)||0
   }));
   const pcvPrompt=`JesteĹ› wyspecjalizowanym kontrolerem oznaczeĹ„ PCV w KMS.
Nie wykonujesz ponownie peĹ‚nej analizy. Masz sprawdziÄ‡ TYLKO:
1. Czy na ĹşrĂłdle wystÄ™puje ogĂłlna adnotacja PCV 1MM albo PCV 2MM.
2. Ile kresek znajduje siÄ™ przy PIERWSZYM wymiarze kaĹĽdego wiersza: 0, 1 albo 2.
3. Ile kresek znajduje siÄ™ przy DRUGIM wymiarze kaĹĽdego wiersza: 0, 1 albo 2.
4. Kontrolnie popraw dĹ‚ugoĹ›Ä‡, szerokoĹ›Ä‡ i iloĹ›Ä‡, szczegĂłlnie cyfry 9/8/5.

ZASADY:
- Kreska moĹĽe znajdowaÄ‡ siÄ™ NAD cyfrÄ…, POD cyfrÄ… albo bezpoĹ›rednio przy cyfrze.
- Jedna linia oznacza 1 krawÄ™dĹş, dwie rĂłwnolegĹ‚e linie oznaczajÄ… 2 krawÄ™dzie.
- Pierwszy wymiar = dĹ‚ugoĹ›Ä‡. Drugi wymiar = szerokoĹ›Ä‡.
- KoĹ„cowe x1/x2 to iloĹ›Ä‡, nigdy PCV.
- OgĂłlne â€žPCV 1MMâ€ť lub â€žPCV 2MMâ€ť okreĹ›la gruboĹ›Ä‡ obrzeĹĽa dla wszystkich zaznaczonych kresek.
- Nie zwracaj peĹ‚nych elementĂłw ani materiaĹ‚Ăłw. ZwrĂłÄ‡ dokĹ‚adnie jeden wpis dla kaĹĽdego podanego wiersza.
- JeĹĽeli linia jest wyraĹşnie widoczna, policz jÄ…; nie kasuj wszystkich oznaczeĹ„ tylko dlatego, ĹĽe pismo jest odrÄ™czne.
- uncertain=true ustaw tylko dla konkretnego wiersza, ktĂłrego naprawdÄ™ nie moĹĽna rozstrzygnÄ…Ä‡.

Wiersze wstÄ™pnie odczytane przez pierwszy przebieg:
${JSON.stringify(rowsForAudit)}`;
   const auditContent=[{type:'input_text',text:pcvPrompt},sourcePart];
   const audited=await client.responses.create({
    model,
    input:[{role:'user',content:auditContent}],
    text:{format:{type:'json_schema',name:'kms_pcv_marks_audit',schema:pcvAuditSchema,strict:true}}
   });
   pcvAudit=JSON.parse(audited.output_text);
  }

  const suppliedOrderNo=String(first(fields.orderNo)||'').trim();
  const suppliedClient=String(first(fields.client)||'').trim();
  parsed.orderNo=suppliedOrderNo;
  parsed.client=suppliedClient;
  const firstPassPcv=(parsed.items||[]).flatMap(x=>[x.edge1,x.edge2,x.edge3,x.edge4]).find(v=>v==='1MM'||v==='2MM')||'';
  const summaryText=`${parsed.rawSummary||''} ${parsed.notes||''}`.toUpperCase();
  const summaryPcv=/PCV\s*2\s*MM/.test(summaryText)?'2MM':/PCV\s*1\s*MM/.test(summaryText)?'1MM':'';
  const globalPcv=pcvAudit?.globalPcv||firstPassPcv||summaryPcv||'';
  const auditRows=new Map((pcvAudit?.rows||[]).map(r=>[Number(r.row),r]));

  parsed.items=(parsed.items||[]).map((x,i)=>{
   const text=`${x.element||''} ${x.material||''} ${x.info||''} ${x.notes||''}`.toUpperCase();
   const thicknessMatch=text.match(/(?:GR(?:UBOĹšÄ†)?\.?\s*[:=-]?\s*|#\s*)(\d+(?:[.,]\d+)?)\s*MM\b/i);
   const fixedThickness=(x.technology==='10MM'||/\b10\s*MM\b/.test(text))?10:(x.technology==='16MM'||/\b16\s*MM\b/.test(text))?16:(x.technology==='36MM'||/\b36\s*MM\b/.test(text))?36:(x.technology==='28MM'||/\b28\s*MM\b/.test(text))?28:(x.technology==='BLAT_38MM'||/\bBLAT\s*38\s*MM\b/.test(text))?38:(x.technology==='HPL_12MM'||/\bHPL\s*12\s*MM\b/.test(text))?12:Number(x.thickness)||Number(String(thicknessMatch?.[1]||'').replace(',','.'))||0;
   const audit=auditRows.get(i+1);
   const lengthMarks=Math.max(0,Math.min(2,Number(audit?.lengthMarks)||0));
   const widthMarks=Math.max(0,Math.min(2,Number(audit?.widthMarks)||0));
   const hasMarks=lengthMarks>0||widthMarks>0;
   const noPcvForMarks=hasMarks&&!globalPcv;
   const auditNote=String(audit?.notes||'').trim();
   const combinedNotes=[String(x.notes||'').trim(),auditNote,pcvAudit?.globalPcvUncertain?'Niepewny rodzaj PCV.':'',noPcvForMarks?'Widoczne kreski, ale nie odczytano 1MM/2MM.':''].filter(Boolean).join(' | ');
   return {
    ...x,
    length:Number(audit?.length)||Number(x.length)||0,
    width:Number(audit?.width)||Number(x.width)||0,
    qty:Number(audit?.qty)||Number(x.qty)||0,
    thickness:fixedThickness,
    edge1:lengthMarks>=1&&globalPcv?globalPcv:'',
    edge2:lengthMarks>=2&&globalPcv?globalPcv:'',
    edge3:widthMarks>=1&&globalPcv?globalPcv:'',
    edge4:widthMarks>=2&&globalPcv?globalPcv:'',
    notes:combinedNotes,
     uncertain:!!audit?.uncertain||!!pcvAudit?.globalPcvUncertain||noPcvForMarks||!(fixedThickness>0)
   }
  });
  if(pcvAudit){
   parsed.notes=[String(parsed.notes||'').trim(),`Kontrola PCV: ${pcvAudit.globalPcv||'nie odczytano'}; ${pcvAudit.notes||''}`].filter(Boolean).join(' | ');
  }
  return res.status(200).json(parsed);
 }catch(e){console.error(e);return res.status(500).json({ok:false,error:e.message||'BĹ‚Ä…d analizy AI',details:'SprawdĹş OPENAI_API_KEY, model i logi Vercel.'})}
}

