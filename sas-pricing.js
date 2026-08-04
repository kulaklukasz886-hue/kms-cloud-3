(()=>{
  'use strict';
  const DATA_URL='/data/sas-pricing.json?v=KMS-SAS-AE-2026-07-27-V2';
  const GROUPS=['A','B','C','D','E'];
  let catalog=null;
  let rows=[];

  const money=value=>new Intl.NumberFormat('pl-PL',{
    style:'currency',
    currency:'PLN'
  }).format(Number(value)||0);

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  })[char]);

  const normalize=value=>String(value||'').trim().toUpperCase().replace(/\s+/g,' ');

  function rowObject(row){
    return Object.fromEntries(catalog.columns.map((key,index)=>[key,row[index]]));
  }

  function find(query,thickness){
    const normalizedQuery=normalize(query);
    const normalizedThickness=Number(thickness)||0;
    return rows.filter(item=>{
      const matchesText=!normalizedQuery
        || normalize(item.symbol).includes(normalizedQuery)
        || normalize(item.decorName).includes(normalizedQuery);
      const matchesThickness=!normalizedThickness
        || Number(item.thicknessMm)===normalizedThickness;
      return matchesText&&matchesThickness;
    }).slice(0,100);
  }

  function quote(item,group='B',discount=0){
    const selectedGroup=GROUPS.includes(group)?group:'B';
    const groupPrice=Number(item[`price${selectedGroup}`])||0;
    const selectedDiscount=Math.max(0,Math.min(100,Number(discount)||0));
    return {
      group:selectedGroup,
      groupPrice,
      discount:selectedDiscount,
      finalPrice:Math.round(groupPrice*(1-selectedDiscount/100)*100)/100,
      currency:'PLN',
      unit:'m²',
      version:catalog.meta.version
    };
  }

  function addStyle(){
    if(document.getElementById('sasPriceStyle'))return;
    const style=document.createElement('style');
    style.id='sasPriceStyle';
    style.textContent=`
      #sasPriceModal{position:fixed;inset:0;background:#020617cc;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px}
      #sasPriceModal.hidden{display:none}
      .sas-box{background:#fff;color:#0f172a;border-radius:18px;width:min(1150px,96vw);max-height:92vh;overflow:auto;box-shadow:0 25px 80px #0008}
      .sas-head{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #cbd5e1}
      .sas-head h2{margin:0}
      .sas-close{font-size:24px;border:0;background:#e2e8f0;border-radius:10px;padding:5px 12px}
      .sas-controls{display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:10px;padding:18px}
      .sas-controls input,.sas-controls select{padding:11px;border:1px solid #94a3b8;border-radius:9px}
      .sas-controls button{background:#2563eb;color:#fff;border:0;border-radius:9px;padding:10px 18px;font-weight:700}
      .sas-info{margin:0 18px 12px;padding:10px 12px;border-radius:10px;background:#eff6ff;color:#1e3a8a}
      .sas-table{width:calc(100% - 36px);margin:0 18px 20px;border-collapse:collapse;font-size:13px}
      .sas-table th,.sas-table td{padding:9px;border-bottom:1px solid #e2e8f0;text-align:left}
      .sas-table th{position:sticky;top:0;background:#f8fafc}
      .sas-final{font-weight:800;color:#166534}
      .sas-nav-btn{width:100%;text-align:left;margin:3px 0;padding:10px 12px;border:0;border-radius:9px;background:transparent;color:inherit;font-weight:700}
      .sas-nav-btn:hover{background:#334155}
      @media(max-width:800px){
        .sas-controls{grid-template-columns:1fr 1fr}
        .sas-controls input:first-child{grid-column:1/-1}
        .sas-table{font-size:11px}
      }
    `;
    document.head.appendChild(style);
  }

  function render(){
    const query=document.getElementById('sasQuery').value;
    const thickness=document.getElementById('sasThickness').value;
    const group=document.getElementById('sasGroup').value;
    const discount=document.getElementById('sasDiscount').value;
    localStorage.setItem('kmsSasGroup',group);
    localStorage.setItem('kmsSasDiscount',discount);
    const results=find(query,thickness);
    document.getElementById('sasCount').textContent=
      `${results.length} wyników • cennik ${catalog.meta.version} • ${catalog.meta.activeRows} aktywnych pozycji`;
    document.getElementById('sasRows').innerHTML=results.map(item=>{
      const price=quote(item,group,discount);
      return `<tr>
        <td><b>${esc(item.symbol)}</b><br><small>${esc(item.decorName)}</small></td>
        <td>${esc(item.thicknessMm)} mm</td>
        <td>${esc(item.specification||'—')}</td>
        <td>${esc(item.materialType)}</td>
        <td>${esc(item.sasGroup)}</td>
        <td>${money(price.groupPrice)}</td>
        <td>${esc(price.discount)}%</td>
        <td class="sas-final">${money(price.finalPrice)}/m²</td>
      </tr>`;
    }).join('')||'<tr><td colspan="8">Brak pozycji spełniających kryteria.</td></tr>';
    window.dispatchEvent(new CustomEvent('kms-sas-pricing-change',{detail:{group,discount:Number(discount)||0}}));
  }

  function open(){
    document.getElementById('sasPriceModal').classList.remove('hidden');
    document.getElementById('sasQuery').focus();
    render();
  }

  function close(){
    document.getElementById('sasPriceModal').classList.add('hidden');
  }

  function createUi(){
    addStyle();
    const modal=document.createElement('div');
    modal.id='sasPriceModal';
    modal.className='hidden';
    modal.innerHTML=`
      <section class="sas-box">
        <header class="sas-head">
          <div>
            <h2>💵 Cennik SAS A–E</h2>
            <small>Kontrolowana kopia cennika w KMS TESTOWY</small>
          </div>
          <button class="sas-close" aria-label="Zamknij">×</button>
        </header>
        <div class="sas-controls">
          <input id="sasQuery" placeholder="Symbol lub nazwa dekoru, np. W960 ST7">
          <input id="sasThickness" type="number" step="0.1" placeholder="Grubość mm">
          <select id="sasGroup">${GROUPS.map(group=>`<option>${group}</option>`).join('')}</select>
          <input id="sasDiscount" type="number" min="0" max="100" step="0.1" placeholder="Rabat %">
          <button id="sasSearch">Szukaj</button>
        </div>
        <div id="sasCount" class="sas-info"></div>
        <table class="sas-table">
          <thead>
            <tr>
              <th>Materiał</th>
              <th>Grubość</th>
              <th>Specyfikacja</th>
              <th>Typ</th>
              <th>Grupa SAS</th>
              <th>Cena grupowa brutto</th>
              <th>Rabat</th>
              <th>Cena końcowa brutto</th>
            </tr>
          </thead>
          <tbody id="sasRows"></tbody>
        </table>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.sas-close').onclick=close;
    modal.onclick=event=>{if(event.target===modal)close()};
    ['sasQuery','sasThickness','sasGroup','sasDiscount'].forEach(id=>{
      document.getElementById(id).addEventListener(id==='sasQuery'?'input':'change',render);
    });
    document.getElementById('sasSearch').onclick=render;
    document.getElementById('sasGroup').value=localStorage.getItem('kmsSasGroup')||'B';
    document.getElementById('sasDiscount').value=localStorage.getItem('kmsSasDiscount')||'0';

    const addButton=()=>{
      if(document.getElementById('sasPriceNav'))return;
      const buttons=[...document.querySelectorAll('button')];
      const anchor=buttons.find(button=>button.textContent.includes('Dostawcy'))
        ||buttons.find(button=>button.textContent.includes('Rozliczenia'));
      if(!anchor)return;
      const button=document.createElement('button');
      button.id='sasPriceNav';
      button.className=`${anchor.className||''} sas-nav-btn`;
      button.textContent='💵 Cennik SAS';
      button.onclick=open;
      anchor.insertAdjacentElement('afterend',button);
    };
    addButton();
    new MutationObserver(addButton).observe(document.body,{childList:true,subtree:true});
  }

  async function init(){
    try{
      const response=await fetch(DATA_URL,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      catalog=await response.json();
      rows=catalog.rows.map(rowObject);
      window.KmsSasPricing={meta:catalog.meta,find,quote,open};
      createUi();
      window.dispatchEvent(new CustomEvent('kms-sas-ready',{detail:{version:catalog.meta.version}}));
    }catch(error){
      console.error('Cennik SAS:',error);
    }
  }

  document.readyState==='loading'
    ?document.addEventListener('DOMContentLoaded',init)
    :init();
})();
