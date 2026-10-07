const sharp = require('sharp');

const svg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0c08"/>
      <stop offset="50%" stop-color="#18130d"/>
      <stop offset="100%" stop-color="#0a0805"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#fff3c4"/>
      <stop offset="100%" stop-color="#aa820a"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1000" height="1000" fill="url(#bg)"/>
  <rect x="25" y="25" width="950" height="950" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.3" rx="12"/>
  <rect x="35" y="35" width="930" height="930" fill="none" stroke="#d4af37" stroke-width="0.75" opacity="0.15" rx="8"/>

  <!-- Header -->
  <text x="500" y="110" font-size="20" fill="#d4af37" letter-spacing="4" text-anchor="middle" font-family="sans-serif">ZAHRAT BEESAN PARFUMS</text>
  <text x="500" y="165" font-size="34" font-weight="bold" fill="url(#gold)" text-anchor="middle" font-family="sans-serif">الهرم العطري • FRAGRANCE PYRAMID</text>
  <text x="500" y="210" font-size="24" fill="#ffffff" text-anchor="middle" font-family="sans-serif">عطر بربل روز (Purple Rose)</text>
  
  <line x1="200" y1="240" x2="800" y2="240" stroke="#d4af37" stroke-width="1" opacity="0.4"/>

  <!-- Top Notes -->
  <rect x="100" y="270" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="315" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">الافتتاحية • TOP NOTES</text>
  <text x="500" y="375" font-size="21" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">فراولة، تفاح، قرفة، ريحان، برتقال، وبرغموت</text>

  <!-- Heart Notes -->
  <rect x="100" y="460" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="505" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قلب العطر • HEART NOTES</text>
  <text x="500" y="565" font-size="21" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">زنبق الوادي، يلانغ يلانغ، ورد، قهوة، وياسمين</text>

  <!-- Base Notes -->
  <rect x="100" y="650" width="800" height="160" fill="#ffffff" fill-opacity="0.03" stroke="#d4af37" stroke-width="1" stroke-opacity="0.25" rx="10"/>
  <text x="500" y="695" font-size="20" font-weight="bold" fill="#f7d070" text-anchor="middle" font-family="sans-serif">قاعدة العطر • BASE NOTES</text>
  <text x="500" y="755" font-size="21" fill="#f3f4f6" text-anchor="middle" font-family="sans-serif">عنبر، خشب الصندل، فانيليا، خشب الأرز، ومسك</text>

  <!-- Footer Prominent & Perfumer -->
  <rect x="100" y="840" width="800" height="90" fill="#ffffff" fill-opacity="0.02" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.15" rx="8"/>
  <text x="500" y="875" font-size="18" fill="#d4af37" text-anchor="middle" font-family="sans-serif">الروائح البارزة: العنبر، الورد، التونكا، والقهوة</text>
  <text x="500" y="905" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">توقيع العطار العالمي: Philippe Paparella-Paris</text>
</svg>
`;

sharp(Buffer.from(svg))
  .jpeg({ quality: 95 })
  .toFile('scripts/test_pyramid_card.jpg')
  .then(() => console.log('Successfully generated scripts/test_pyramid_card.jpg'))
  .catch(err => console.error(err));
