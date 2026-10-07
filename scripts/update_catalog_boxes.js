const fs = require('fs');

const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Verified map of bottle with box images
const boxImageMap = {
  // Fragrantica secundar (bottle with official box)
  'purple-rose': 'https://fimgs.net/mdimg/secundar/o.99670.jpg',
  'ambitious': 'https://fimgs.net/mdimg/secundar/o.99667.jpg',
  'amber-cashmere': 'https://fimgs.net/mdimg/secundar/o.99668.jpg',
  'oud-argent': 'https://fimgs.net/mdimg/secundar/o.99669.jpg',
  'liana': 'https://fimgs.net/mdimg/secundar/o.99671.jpg',
  'just-amber': 'https://fimgs.net/mdimg/secundar/o.99672.jpg',
  'just-oud': 'https://fimgs.net/mdimg/secundar/o.99673.jpg',
  'attraction': 'https://fimgs.net/mdimg/secundar/o.99674.jpg',
  'utopia-gist': 'https://fimgs.net/mdimg/secundar/o.99675.jpg',

  // Salla official bottle with box / packaging images
  'cartage-noble': 'https://cdn.salla.sa/Dqvgy/b8408ecb-25ca-4e76-b475-60092b6c1a2d-1000x800.03632401017-OJnciOe5i0tyaCoDUAuOGYzC8y7DFcYb5H958t4W.jpg',
  'cartage-etoile': 'https://cdn.salla.sa/Dqvgy/b21dc6bd-a978-408c-9306-9ac078964892-1000x800.03632401017-oqtWyTGNAIxaU5JqzJWqDY5g3ZbdG8dQ4VM8l1X1.jpg',
  'cartage-velours': 'https://cdn.salla.sa/Dqvgy/1190ba68-2200-4989-8f2c-751debd8f505-1000x800.03632401017-KCzugtjWYROnpSoNsWjAe01qLJuW7DZU4sqe1lku.jpg',
  'most-wanted': 'https://cdn.salla.sa/Dqvgy/41a5a6d6-3af5-4b73-bf01-16a5c29da635-1000x1000-IxmNmruZWfOVYKdFII91qri0vLKMVoMKrU9bxH4u.jpg',
  'silk-essence': 'https://cdn.salla.sa/Dqvgy/e2600494-d766-4886-9c0d-84b1fa8debae-1000x800.05729017474-6HzpeNkTayVVTxmerlHGVK5bSG82zBbbD41dQy2Q.jpg',
  'boudoir': 'https://cdn.salla.sa/Dqvgy/1c7860c2-fe87-43c7-802d-ade8b78bb89f-1000x800.05729017474-f7cT80g5p1Kh1fc6NiVM28dEzh4IrTBaKxDpJ6ip.jpg',
  'serenade': 'https://cdn.salla.sa/Dqvgy/026d3701-683b-4632-b714-cd957a592b03-1000x800.05729017474-vX6z3Q1NYpbgn7LqZWXfOiKoHpXOwYNBUHI6Db5k.jpg',
  'eternal-passion': 'https://cdn.salla.sa/Dqvgy/803f9ba2-7e20-4bc7-949b-f0ddfcf030de-1000x800.05729017474-8tRPStK0M9g0XJL3tVebNkqDIt6KYoHIrnlhYw2h.jpg',
  'amber-oud': 'https://cdn.salla.sa/Dqvgy/6eab1914-871e-4fea-9260-4fe4e688e9b7-1000x1000-BBskZynlMOuFLmgdb5TgifaPZ46TgosHWCGcvpXS.jpg',
  'seraj': 'https://cdn.salla.sa/Dqvgy/25a8ac07-aae6-48f5-8056-c18e375d9a86-1000x1000-Qg8jW2Z87I4ylmy8SWsjZ0psCnnA4JbUAtpz5oHe.jpg',
  'first-impression': 'https://cdn.salla.sa/Dqvgy/7fc9bc9c-fc4d-45ea-ba82-1b77989e59e3-1000x1000-GKZlG9lrDZRFSw5kMUgIFZyXoz4wI3CSOZ7RK3t8.jpg',
  'perfume-2016': 'https://cdn.salla.sa/Dqvgy/2Zgwu1fWwTuNMyfOA3PoVSnPwCvNQM9qtII6bXYi.jpg',
  'perfume-1985': 'https://cdn.salla.sa/Dqvgy/HIyE0QM2OJX7RAeZociTatvKGY8NztM8xJwzCpLj.jpg',
  'spring': 'https://cdn.salla.sa/Dqvgy/ec1fee17-4caa-4f6a-9101-3f03fb3bebdf-1000x1000-COywX67MI0D96XExqG7ZeyuAxfWuznQhyugAd9vJ.jpg',
  'rica': 'https://cdn.salla.sa/Dqvgy/19252398-db41-49aa-82a5-2bbbf65c7ae4-1000x1000-nYD3TFSF9GHlonnOCVwdYTEtfozR49vnVfKaXuA6.jpg',
  'sparkle': 'https://cdn.salla.sa/Dqvgy/f8627190-27e0-4b6b-ba4b-c702023b0c58-1000x1000-ZH2Mbohuha2O7n16VmYhkcgmOHgesVLq8Ic2Ilrz.jpg',
  'sublime-flowers': 'https://cdn.salla.sa/Dqvgy/11793243-8e9c-4ef4-adf0-e3ad67820753-1000x1000-Ltgg1yQuyr6DsMFj8knWZpFBXMY74rfQL1qUiwjj.jpg',
  'iris-musk': 'https://cdn.salla.sa/Dqvgy/c920896f-16c5-440d-b46f-3b8309171ab4-1000x1000-QYYsk7MyEvHwtgsApvNeBLtuxpIQ5XUEhRsxc7x2.jpg',

  // Gift Sets and Bundles Luxury Box Packages
  'package-cartage-noble': 'https://cdn.salla.sa/Dqvgy/96a3d02d-1350-42d5-ac8f-0fb677a20a62-1000x1000-JwEMFdJ9uKLsjHpEP4bXmjcS9gcl8DsEtUICSsnz.jpg',
  'package-cartage-etoile': 'https://cdn.salla.sa/Dqvgy/6175dd9a-1f82-45b3-8328-7fe370352594-1000x1000-SIrg7qUVPIU9XnAe0oVQJiozPhVdOgotGzhrP9xG.jpg',
  'package-cartage-velours': 'https://cdn.salla.sa/Dqvgy/93256a4a-ed8a-42c6-80f6-6f2564bb0e11-1000x1000-xVK5Gzyy3zpJ2oq6nEqAWZqdSDkA8IBur6SdHIKC.jpg',
  'bundle-body-musk': 'https://cdn.salla.sa/Dqvgy/587ddc10-ff3e-435e-8467-454fb28f46ae-1000x1000-Ux2vVQPMFyJUZkRKlRhwT4zkjXRbCaOpYWEBVZ77.jpg',
  'bundle-al-saada': 'https://cdn.salla.sa/Dqvgy/b349bfd6-20f4-4f27-ae29-93721e091ea6-1000x1000-En6CbU2udAqKN4jxd0qoZq9NPR0Jg6ZSJw34GK2J.jpg',
  'bundle-discovery': 'https://cdn.salla.sa/Dqvgy/8d7972b3-23df-42e7-ac97-dcc3903c3970-1000x1000-B4wN4Abc07UXeQElkZQiKqWRRD9tjSm1nWK7Sznp.jpg',
  'luxury-edition': 'https://cdn.salla.sa/Dqvgy/ae97eda1-5f9b-430e-be9f-5e1222a859d7-1000x1000-TwQIMvZBQK7V5EXU7fcPaV56ju5V7pwzpP3BS75R.jpg'
};

let assignedCount = 0;

perfumes.forEach(p => {
  if (boxImageMap[p.id]) {
    p.boxImage = boxImageMap[p.id];
    assignedCount++;
  } else {
    p.boxImage = null;
  }

  // Clean up galleryImages:
  // Remove p.image, p.originalImage, p.boxImage, p.bottleUrl, p.fragranticaBottle, and p.fragranticaCard
  // also remove duplicates
  const seen = new Set([
    p.image,
    p.originalImage,
    p.boxImage,
    p.bottleUrl,
    p.fragranticaBottle,
    p.fragranticaCard
  ].filter(Boolean));

  const cleanGallery = [];
  if (Array.isArray(p.galleryImages)) {
    p.galleryImages.forEach(img => {
      if (!img) return;
      if (seen.has(img)) return;
      if (img.includes('500x500') || img.includes('100x100') || img.includes('lsSRUDFXv00bFNJa4GiHjtn4Y9KTDd1SCrksaoPn')) return;
      // Do not repeat flacon
      if (img.includes('/perfume/o.') || img.includes('/perfume-thumbs/')) return;
      seen.add(img);
      cleanGallery.push(img);
    });
  }

  p.galleryImages = cleanGallery;
});

fs.writeFileSync('public/data/perfumes.json', JSON.stringify(perfumes, null, 2), 'utf8');
console.log(`Updated perfumes.json: ${assignedCount} items assigned luxury box images, galleries deduplicated.`);
