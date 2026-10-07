async function searchBoutiqaat(sku) {
  const url = 'https://www.boutiqaat.com/ar-ae/catalogsearch/result/?q=' + sku;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const text = await res.text();
      const m = text.match(/<a class="product-item-link"[^>]*>([\s\S]*?)<\/a>/g) || [];
      console.log(sku, '->', m.map(x => x.replace(/<[^>]+>/g, '').trim()));
    }
  } catch(e) {
    console.log(sku, 'error:', e.message);
  }
}

async function run() {
  for (const sku of ['ORL-00005452', 'ORL-00005453', 'ORL-00005454', 'ORL-00005467', 'ORL-00005468', 'ORL-00005470']) {
    await searchBoutiqaat(sku);
  }
}

run();
