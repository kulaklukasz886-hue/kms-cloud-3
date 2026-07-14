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
 try{await requireAuth(req,['ADMIN','BIURO']);}catch(e){return fail(res,e,'Brak dostępu do analizy zamówień');}
 if(req.method==='GET')return res.status(200).json({ok:true,message:'KMS Analiza Zamówień 1→2→3 działa. Użyj POST z plikiem.'});
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
   if(!spreadsheetText.trim())return res.status(400).json({ok:false,error:'Nie udało się odczytać treści arkusza Excel/CSV w przeglądarce.'});
  }else if(mime==='application/pdf'||/\.pdf$/i.test(fileName)){
   sourcePart={type:'input_file',filename:fileName,file_data:dataUrl(mime,bytes.toString('base64'))};
  }else if(mime.startsWith('image/')){
   sourcePart={type:'input_image',image_url:dataUrl(mime,bytes.toString('base64')),detail:'original'};
  }else{
   return res.status(400).json({ok:false,error:'Obsługiwane pliki: zdjęcia, PDF, XLSX, XLS i CSV.'});
  }
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const prompt=`Jesteś modułem KMS — ETAP 1: wierne mapowanie zamówienia klienta z odręcznej rozpiski, zdjęcia lub PDF.

NADRZĘDNE ZASADY:
1. Przepisz dane 1:1. Na Etapie 1 nie stosuj zmian technologicznych i nie poprawiaj wymiarów klienta.
2. Zachowaj pełny symbol materiału dokładnie tak, jak jest zapisany. Nie skracaj i nie zgaduj dekoru.
3. Długość zapisuj jako pierwszy wymiar, szerokość jako drugi. Wszystkie wymiary w mm.
4. Ilość, grubość i każdą krawędź do oklejania odczytaj oddzielnie.
5. Zapis „2570 × 800 × 1” oznacza: długość 2570, szerokość 800, ILOŚĆ 1. Ostatnie „×1”, „×2”, „x1”, „x2” jest zawsze ilością — NIGDY grubością PCV.
6. Kreski technologiczne mogą być narysowane NAD, POD albo bezpośrednio przy cyfrze wymiaru. Są częścią zamówienia i muszą być odczytane osobno dla każdego wymiaru.
7. Pierwszy wymiar to długość:
   - jedna kreska przy pierwszym wymiarze = edge1,
   - dwie kreski przy pierwszym wymiarze = edge1 i edge2.
8. Drugi wymiar to szerokość:
   - jedna kreska przy drugim wymiarze = edge3,
   - dwie kreski przy drugim wymiarze = edge3 i edge4.
9. Ogólna notatka „PCV 1MM” lub „PCV 2MM” określa typ obrzeża. Zastosuj ten typ WYŁĄCZNIE do krawędzi wskazanych kreskami. Sama notatka PCV bez kresek nie tworzy żadnej krawędzi.
10. Brak kreski przy danym wymiarze oznacza brak oklejania na krawędziach tego wymiaru.
11. Ostatnie „×1” lub „×2” oznacza wyłącznie ilość sztuk i nigdy nie może zmienić PCV ani liczby kresek.
12. Szczególnie dokładnie rozróżniaj ręcznie zapisane cyfry 9, 8 i 5. Przed zwróceniem wyniku wykonaj ponowne porównanie każdej wartości zawierającej 9 ze zdjęciem. Nie zamieniaj 90 na 80 ani 50. Jeśli znak pozostaje niepewny, ustaw uncertain=true zamiast zgadywać.
13. Grubość ustala KMS, nie odczyt AI: zwykła płyta = 18 mm; oznaczenie 10MM = 10 mm; oznaczenie 16MM = 16 mm; oznaczenie 28MM = 28 mm; oznaczenie 36MM = 36 mm. Nie pobieraj grubości z końcowego x1/x2 ani z opisu PCV.
14. Nie wymyślaj kodu PCV. Przepisz go tylko, gdy występuje.
15. technology jest jedynie sugestią do późniejszej kontroli: 10MM, 16MM, 36MM, 28MM, element zbiorczy, fronty ze słojem, lamele, inne; nie przeliczaj jeszcze wymiarów.
16. Jeżeli cokolwiek jest nieczytelne, wpisz 0 lub pusty tekst, opisz problem w notes, ustaw uncertain=true i obniż confidence.
17. Każdy osobny wiersz/element zamówienia zwróć jako osobną pozycję.

Dane podane przez pracownika (mogą być puste): nr zlecenia: ${first(fields.orderNo)||''}; klient: ${first(fields.client)||''}.
Zwróć wyłącznie JSON zgodny ze schematem.`;
  const content=[{type:'input_text',text:prompt}];
  if(isSpreadsheet)content.push({type:'input_text',text:`ŹRÓDŁO: ARKUSZ EXCEL/CSV ${fileName}\nKolumny i wiersze zostały odczytane z pliku. Zachowaj każdy wiersz 1:1.\n\n${spreadsheetText}`});
  else content.push(sourcePart);
  const model=process.env.OPENAI_MODEL||'gpt-5.6-sol';
  const response=await client.responses.create({model,input:[{role:'user',content}],text:{format:{type:'json_schema',name:'kms_order_stage1',schema,strict:true}}});
  let parsed=JSON.parse(response.output_text);

  // Drugi, niezależny przebieg: wyłącznie wymiary kontrolne, rodzaj PCV i liczba kresek.
  let pcvAudit=null;
  if(!isSpreadsheet){
   const rowsForAudit=(parsed.items||[]).map((x,i)=>({
    row:i+1,
    length:Number(x.length)||0,
    width:Number(x.width)||0,
    qty:Number(x.qty)||0
   }));
   const pcvPrompt=`Jesteś wyspecjalizowanym kontrolerem oznaczeń PCV w KMS.
Nie wykonujesz ponownie pełnej analizy. Masz sprawdzić TYLKO:
1. Czy na źródle występuje ogólna adnotacja PCV 1MM albo PCV 2MM.
2. Ile kresek znajduje się przy PIERWSZYM wymiarze każdego wiersza: 0, 1 albo 2.
3. Ile kresek znajduje się przy DRUGIM wymiarze każdego wiersza: 0, 1 albo 2.
4. Kontrolnie popraw długość, szerokość i ilość, szczególnie cyfry 9/8/5.

ZASADY:
- Kreska może znajdować się NAD cyfrą, POD cyfrą albo bezpośrednio przy cyfrze.
- Jedna linia oznacza 1 krawędź, dwie równoległe linie oznaczają 2 krawędzie.
- Pierwszy wymiar = długość. Drugi wymiar = szerokość.
- Końcowe x1/x2 to ilość, nigdy PCV.
- Ogólne „PCV 1MM” lub „PCV 2MM” określa grubość obrzeża dla wszystkich zaznaczonych kresek.
- Nie zwracaj pełnych elementów ani materiałów. Zwróć dokładnie jeden wpis dla każdego podanego wiersza.
- Jeżeli linia jest wyraźnie widoczna, policz ją; nie kasuj wszystkich oznaczeń tylko dlatego, że pismo jest odręczne.
- uncertain=true ustaw tylko dla konkretnego wiersza, którego naprawdę nie można rozstrzygnąć.

Wiersze wstępnie odczytane przez pierwszy przebieg:
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
   const fixedThickness=(x.technology==='10MM'||/\b10\s*MM\b/.test(text))?10:(x.technology==='16MM'||/\b16\s*MM\b/.test(text))?16:(x.technology==='36MM'||/\b36\s*MM\b/.test(text))?36:(x.technology==='28MM'||/\b28\s*MM\b/.test(text))?28:18;
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
    uncertain:!!audit?.uncertain||!!pcvAudit?.globalPcvUncertain||noPcvForMarks
   }
  });
  if(pcvAudit){
   parsed.notes=[String(parsed.notes||'').trim(),`Kontrola PCV: ${pcvAudit.globalPcv||'nie odczytano'}; ${pcvAudit.notes||''}`].filter(Boolean).join(' | ');
  }
  return res.status(200).json(parsed);
 }catch(e){console.error(e);return res.status(500).json({ok:false,error:e.message||'Błąd analizy AI',details:'Sprawdź OPENAI_API_KEY, model i logi Vercel.'})}
}
