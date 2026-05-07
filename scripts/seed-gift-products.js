// Script pentru inserare produse initiale in Supabase
// Ruleaza: node scripts/seed-gift-products.js

const SUPABASE_URL = 'https://iifbzrvhqobwwlespvyg.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

const products = [
  { pnk: 'D96CB5MBM', title: 'Cutie alimentară pizza/sandwich silicon TopAquar Pizza Pack pliabilă 5 tăvi' },
  { pnk: 'DFXBRDMBM', title: 'Periuță de dinți pentru copii Grunluftr Mini-U rezistentă la apă 360° silicon 5 viteze' },
  { pnk: 'D8DD1CMBM', title: 'Cameră web Srihome SH001 FullHD 2MP unghi 90° 30fps anulare zgomot Plug & Play' },
  { pnk: 'DW5P22MBM', title: 'Încărcător wireless birou rotund Loowoko X9 10W Fast Charge LED negru' },
  { pnk: 'DSTWLF3BM', title: 'Recipient tip lopățică KD Homer pentru colectare excremente câini/pisici + set pungi' },
  { pnk: 'DDFGBLMBM', title: 'Cârlig pentru tetieră auto Techoner Little Helper agățare pungă + suport telefon' },
  { pnk: 'DR1PFD3BM', title: 'Set 4 recipiente alimente cu capac silicon KD Homer Silly Cup depozitare mâncare/fructe' },
  { pnk: 'DXQNVD3BM', title: 'KD Homer Drain Pro strecurătoare cu mâner pliabil + funcție bol cu capac fructe/legume' },
  { pnk: 'D8J4R5YBM', title: 'Stand dublu încărcare wireless birou Loowoko S19 Pro telefon + ceas 10W Fast Charge aluminiu' },
  { pnk: 'D0ZN18BBM', title: 'Încărcător wireless Loowoko LWC-F07 10W disipare căldură metalic logo luminos negru' },
  { pnk: 'D3VJS5YBM', title: 'Perie corp Horigenr Perfect Skin Pro silicon exfoliantă previne fire încarnate roz' },
  { pnk: 'DWWL0GYBM', title: 'Piatră epilare prin frecare Horigenr Cristal Glass din cristal reutilizabilă nano glass roz' },
  { pnk: 'DYLY8JMBM', title: 'Caiet cu pagini negre Kidprotect 14 pagini + 12 carioci + 2 cârpe ștergere galben' },
  { pnk: 'DQMNQBMBM', title: 'Încărcător wireless Loowoko LWC-F02 10W Fast Charge fără radiații auto-oprire negru' },
  { pnk: 'DH3Z45YBM', title: 'Căști wireless RunmusR H11 Pro CVC 8.0 Low Latency BT 5.3 control touch carcasă magnetică negru' },
  { pnk: 'D7V4WGMBM', title: 'Căști wireless RunmusR H11 CVC 8.0 Low Latency BT 5.3 control touch carcasă magnetică roz' },
  { pnk: 'DKBDYTMBM', title: 'Aparat masaj facial Dermaroller Horigenr Derma Pro V1 regenerare piele 540 ace titan 0.25mm roz' },
  { pnk: 'DDV4WGMBM', title: 'Căști wireless RunmusR H11 CVC 8.0 Low Latency BT 5.3 control touch carcasă magnetică alb' },
  { pnk: 'DTV4WGMBM', title: 'Căști wireless RunmusR H11 CVC 8.0 Low Latency BT 5.3 control touch carcasă magnetică albastru' },
  { pnk: 'DQ53D7MBM', title: 'Încărcător wireless birou rotund Loowoko A8 10W Fast Charge ultrasubțire LED Qi universal' },
]

async function seed() {
  for (const p of products) {
    const emag_url = `https://www.emag.ro/product_details/pd/${p.pnk}`
    const body = JSON.stringify({
      pnk: p.pnk,
      title: p.title,
      emag_url,
      description: null,
      price: null,
      image_url: null,
      updated_at: new Date().toISOString(),
    })

    const res = await fetch(`${SUPABASE_URL}/rest/v1/gift_products`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body,
    })

    if (res.ok || res.status === 201) {
      console.log(`✅ ${p.pnk} — ${p.title.substring(0, 50)}`)
    } else {
      const err = await res.text()
      console.log(`❌ ${p.pnk}: ${err}`)
    }
  }
}

seed().then(() => console.log('\nDone!'))
