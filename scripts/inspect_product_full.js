async function check() {
  const res = await fetch('https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D8%B1%D8%B3%D8%A7%D8%A6%D9%84-%D8%B4%D9%88%D9%82/p113450693');
  const html = await res.text();
  const idx = html.indexOf('id="details_table"');
  if (idx !== -1) {
    console.log(html.substring(idx, idx + 2500).replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).join('\n'));
  }
}
check();
