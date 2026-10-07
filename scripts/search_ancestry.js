const { execSync } = require('child_process');
const fs = require('fs');

const cmd = 'curl.exe -s -L "https://ghalati.com/ar/search?q=Ancestry" -H "User-Agent: Mozilla/5.0"';
const html = execSync(cmd, { encoding: 'utf8' });

const regex = /https:\/\/ghalati\.com\/ar\/[^"'\s]+/g;
const urls = [...new Set(html.match(regex) || [])];
console.log('URLs found for Ancestry on Ghalati:', urls);
