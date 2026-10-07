const fs = require('fs');
const path = require('path');

const brandsDir = path.join(__dirname, '..', 'public', 'images', 'brands');
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

const newBrands = [
  {
    id: 'dokhoun-perfumes',
    name: 'DKHOON',
    nameAr: 'دخون للعطور',
    primary: '#1E1B18',
    secondary: '#000000',
    gold: '#D4AF37',
    goldLight: '#F3E5AB',
    icon: `
      <!-- Dkhoon Crown & Incense Flame -->
      <path d="M36 54 C36 44 42 36 50 32 C58 36 64 44 64 54 C64 63 58 67 50 67 C42 67 36 63 36 54 Z" fill="none" stroke="#D4AF37" stroke-width="2.5"/>
      <path d="M44 48 C44 42 50 38 50 38 C50 38 56 42 56 48 C56 53 50 55 50 55 C50 55 44 53 44 48 Z" fill="#D4AF37"/>
      <circle cx="50" cy="27" r="3" fill="#F3E5AB"/>
      <path d="M32 68 H68" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
    `
  },
  {
    id: 'ibrahim-al-qurashi',
    name: 'IBRAHIM AL QURASHI',
    nameAr: 'إبراهيم القرشي',
    primary: '#2B0E14',
    secondary: '#0F0406',
    gold: '#E5C158',
    goldLight: '#FFF0B3',
    icon: `
      <!-- IAQ Royal Heraldic Crest & Crown -->
      <path d="M35 34 L40 44 L50 32 L60 44 L65 34 L68 50 H32 Z" fill="none" stroke="#E5C158" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="35" cy="30" r="2.2" fill="#FFF0B3"/>
      <circle cx="50" cy="28" r="2.5" fill="#FFF0B3"/>
      <circle cx="65" cy="30" r="2.2" fill="#FFF0B3"/>
      <circle cx="50" cy="58" r="9" fill="none" stroke="#E5C158" stroke-width="2"/>
      <text x="50" y="61.5" font-family="'Cinzel', serif" font-size="8" font-weight="900" fill="#FFF0B3" text-anchor="middle">IAQ</text>
    `
  },
  {
    id: 'atyab-al-marshoud',
    name: 'ATYAB AL MARSHOUD',
    nameAr: 'أطياب المرشود',
    primary: '#0D2B24',
    secondary: '#04120F',
    gold: '#D1AC00',
    goldLight: '#FBE885',
    icon: `
      <!-- Marshoud Historic 1925 Heritage Crest -->
      <circle cx="50" cy="46" r="20" fill="none" stroke="#D1AC00" stroke-width="1.8" stroke-dasharray="2 3"/>
      <path d="M36 46 C36 38 43 32 50 32 C57 32 64 38 64 46 C64 54 57 60 50 60 C43 60 36 54 36 46 Z" fill="none" stroke="#D1AC00" stroke-width="2.5"/>
      <circle cx="50" cy="46" r="6" fill="#D1AC00"/>
      <circle cx="50" cy="46" r="2.5" fill="#FBE885"/>
      <text x="50" y="27" font-family="'Cinzel', serif" font-size="5.5" font-weight="800" fill="#FBE885" text-anchor="middle" letter-spacing="1">SINCE 1925</text>
    `
  },
  {
    id: 'gissah',
    name: 'GISSAH',
    nameAr: 'عطور قصة',
    primary: '#121212',
    secondary: '#000000',
    gold: '#E0B568',
    goldLight: '#FFF2D1',
    icon: `
      <!-- Gissah Iconic Minimal Luxury Seal -->
      <polygon points="50,26 68,37 68,59 50,70 32,59 32,37" fill="none" stroke="#E0B568" stroke-width="2"/>
      <polygon points="50,33 62,40 62,55 50,62 38,55 38,40" fill="none" stroke="#E0B568" stroke-width="1" opacity="0.6"/>
      <text x="50" y="53" font-family="'Cinzel', 'Trajan Pro', serif" font-size="16" font-weight="900" fill="#FFF2D1" text-anchor="middle">G</text>
    `
  },
  {
    id: 'areeb',
    name: 'AREEB',
    nameAr: 'أريب للعطور',
    primary: '#131B2E',
    secondary: '#070A12',
    gold: '#CCA43B',
    goldLight: '#F5E296',
    icon: `
      <!-- Areeb Octagram Star & Monogram -->
      <polygon points="50,26 56,38 68,38 58,46 62,58 50,51 38,58 42,46 32,38 44,38" fill="none" stroke="#CCA43B" stroke-width="2.2"/>
      <circle cx="50" cy="46" r="6" fill="#CCA43B"/>
      <circle cx="50" cy="46" r="2" fill="#F5E296"/>
      <circle cx="50" cy="65" r="2" fill="#CCA43B"/>
    `
  },
  {
    id: 'al-haramain',
    name: 'AL HARAMAIN',
    nameAr: 'الحرمين للعطور',
    primary: '#0B291A',
    secondary: '#03120A',
    gold: '#D6A848',
    goldLight: '#F7DC94',
    icon: `
      <!-- Al Haramain Twin Minarets & Dome -->
      <path d="M35 60 V38 L38 32 L41 38 V60" stroke="#D6A848" stroke-width="2.2" fill="none"/>
      <path d="M59 60 V38 L62 32 L65 38 V60" stroke="#D6A848" stroke-width="2.2" fill="none"/>
      <path d="M42 60 C42 48 50 42 50 42 C50 42 58 48 58 60 Z" fill="#D6A848" opacity="0.8"/>
      <circle cx="50" cy="38" r="2.5" fill="#F7DC94"/>
      <line x1="32" y1="62" x2="68" y2="62" stroke="#D6A848" stroke-width="2.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'swiss-arabian',
    name: 'SWISS ARABIAN',
    nameAr: 'سويس أربيان',
    primary: '#1A2130',
    secondary: '#0A0D14',
    gold: '#C99D42',
    goldLight: '#FCE7A6',
    icon: `
      <!-- Swiss-Arabian Cross & Wings Crest -->
      <circle cx="50" cy="47" r="19" fill="none" stroke="#C99D42" stroke-width="2"/>
      <path d="M47 38 H53 V44 H59 V50 H53 V56 H47 V50 H41 V44 H47 Z" fill="#C99D42"/>
      <path d="M30 47 C34 38 40 34 50 34 C60 34 66 38 70 47" fill="none" stroke="#FCE7A6" stroke-width="1.5" stroke-dasharray="2 2"/>
      <circle cx="50" cy="27" r="2.5" fill="#C99D42"/>
    `
  },
  {
    id: 'ajmal',
    name: 'AJMAL',
    nameAr: 'أجمل للعطور',
    primary: '#24101A',
    secondary: '#0C0509',
    gold: '#E0AA3E',
    goldLight: '#FDE49E',
    icon: `
      <!-- Ajmal 7-Point Starburst & Seal -->
      <polygon points="50,27 54,38 65,34 62,45 73,49 63,55 68,66 57,64 50,73 43,64 32,66 37,55 27,49 38,45 35,34 46,38" fill="none" stroke="#E0AA3E" stroke-width="1.8"/>
      <circle cx="50" cy="50" r="9" fill="#E0AA3E"/>
      <text x="50" y="54" font-family="'Cinzel', serif" font-size="11" font-weight="900" fill="#24101A" text-anchor="middle">A</text>
    `
  },
  {
    id: 'ahmed-al-maghribi',
    name: 'AHMED AL MAGHRIBI',
    nameAr: 'أحمد المغربي للعطور',
    primary: '#2B0E1E',
    secondary: '#10030A',
    gold: '#E5B842',
    goldLight: '#FFF0B0',
    icon: `
      <!-- Moroccan Royal Arch & Trefoil -->
      <path d="M36 62 V48 C36 38 44 32 50 32 C56 32 64 38 64 48 V62" fill="none" stroke="#E5B842" stroke-width="2.5"/>
      <path d="M42 62 V50 C42 44 46 40 50 40 C54 40 58 44 58 50 V62" fill="none" stroke="#FFF0B0" stroke-width="1.8"/>
      <circle cx="50" cy="27" r="3" fill="#E5B842"/>
      <line x1="32" y1="63" x2="68" y2="63" stroke="#E5B842" stroke-width="2.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'ard-al-zaafaran',
    name: 'ARD AL ZAAFARAN',
    nameAr: 'أرض الزعفران',
    primary: '#241407',
    secondary: '#0D0702',
    gold: '#E6A122',
    goldLight: '#FED984',
    icon: `
      <!-- Saffron Blossom & Golden Petals -->
      <circle cx="50" cy="46" r="18" fill="none" stroke="#E6A122" stroke-width="1.8" stroke-dasharray="3 2"/>
      <path d="M50 32 C46 40 46 48 50 54 C54 48 54 40 50 32 Z" fill="#E6A122"/>
      <path d="M37 40 C43 44 48 48 50 54 C44 53 38 48 37 40 Z" fill="#FED984"/>
      <path d="M63 40 C57 44 52 48 50 54 C56 53 62 48 63 40 Z" fill="#FED984"/>
      <circle cx="50" cy="58" r="3" fill="#E6A122"/>
    `
  },
  {
    id: 'surrati',
    name: 'SURRATI',
    nameAr: 'سرتي للعطور',
    primary: '#24190E',
    secondary: '#0C0804',
    gold: '#D9A74A',
    goldLight: '#F9E1A2',
    icon: `
      <!-- Surrati Historic Makkah 1929 Seal -->
      <circle cx="50" cy="45" r="21" fill="none" stroke="#D9A74A" stroke-width="2"/>
      <circle cx="50" cy="45" r="17" fill="none" stroke="#D9A74A" stroke-width="0.8" stroke-dasharray="2 2"/>
      <path d="M50 28 L54 36 L62 38 L56 44 L58 52 L50 48 L42 52 L44 44 L38 38 L46 36 Z" fill="#D9A74A"/>
      <circle cx="50" cy="42" r="3" fill="#24190E"/>
      <text x="50" y="60" font-family="'Cinzel', serif" font-size="5" font-weight="900" fill="#F9E1A2" text-anchor="middle" letter-spacing="1">EST. 1929</text>
    `
  }
];

newBrands.forEach(b => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-${b.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${b.primary}" />
      <stop offset="100%" stop-color="${b.secondary}" />
    </linearGradient>
    <radialGradient id="glow-${b.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${b.gold}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${b.gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="url(#grad-${b.id})" stroke="${b.gold}" stroke-width="1.8"/>
  <circle cx="50" cy="50" r="44" fill="none" stroke="${b.gold}" stroke-width="0.75" stroke-dasharray="2 2" opacity="0.7"/>
  <circle cx="50" cy="50" r="38" fill="url(#glow-${b.id})"/>

  <!-- Official Brand Crest Motif -->
  <g transform="translate(0, -3)">
    ${b.icon}
  </g>

  <!-- Typography Brand Mark -->
  <text x="50" y="86" font-family="'Cinzel', 'Trajan Pro', serif, 'Amiri'" font-size="${b.name.length > 15 ? '6' : (b.name.length > 10 ? '6.8' : '7.5')}" font-weight="900" fill="${b.gold}" text-anchor="middle" letter-spacing="1">${b.name}</text>
</svg>
`;

  const outPath = path.join(brandsDir, `${b.id}.svg`);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log(`Generated: ${b.id}.svg`);
});
