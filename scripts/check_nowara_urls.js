const https = require('https');

https.get('https://ghalati.com/ar/%D8%B9%D8%B7%D8%B1-%D9%86%D9%88%D8%A7%D8%B1%D8%A9/p1764654514', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const regex = /https:\/\/[^"'\s<>]+\.(?:png|jpg|webp)/gi;
    let m;
    const urls = [];
    while ((m = regex.exec(data)) !== null) {
      urls.push(m[0]);
    }
    console.log('Total URLs found:', urls.length);
    [...new Set(urls)].forEach(u => console.log('IMG:', u));
  });
}).on('error', console.error);
