const fs = require('fs');

// Check all data files for image URLs
const full53 = JSON.parse(fs.readFileSync('data/full_53_products.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

console.log('--- Checking full53 products ---');
full53.forEach(p => {
  if (p.galleryImages && p.galleryImages.length > 0) {
    // filter out the logo lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn.png
    // filter out 500x500 thumbnails if 1000x1000 exists
    const useful = p.galleryImages.filter(img => !img.includes('lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn.png'));
    console.log(`[${p.id}] (${p.title}): ${useful.length} images`);
    useful.forEach(u => console.log('   ', u));
  }
});
