const fs = require('fs');
const path = require('path');

const brandsDir = path.join(__dirname, '../public/images/brands');
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

// 26 Fragrance Houses with dedicated vector emblems
const brands = [
  {
    id: 'ghalati',
    bg: '#1a1a1a',
    primary: '#C5A880',
    secondary: '#FFFFFF',
    text: 'GHALATI',
    ar: 'غلاتي',
    symbol: `
      <!-- Royal Crown -->
      <path d="M28 58 L32 38 L42 48 L50 32 L58 48 L68 38 L72 58 Z" fill="#C5A880"/>
      <circle cx="32" cy="36" r="3" fill="#FFE5B4"/>
      <circle cx="50" cy="30" r="3.5" fill="#FFE5B4"/>
      <circle cx="68" cy="36" r="3" fill="#FFE5B4"/>
      <rect x="28" y="60" width="44" height="4" rx="2" fill="#C5A880"/>
    `
  },
  {
    id: 'deraah',
    bg: '#0F172A',
    primary: '#D4AF37',
    secondary: '#FFFFFF',
    text: 'DERAAH',
    ar: 'درعة',
    symbol: `
      <!-- Deraah Shield & Stylized D -->
      <path d="M50 24 L72 32 V52 C72 65 50 76 50 76 C50 76 28 65 28 52 V32 Z" fill="none" stroke="#D4AF37" stroke-width="3"/>
      <path d="M42 38 H52 C58 38 62 42 62 50 C62 58 58 62 52 62 H42 Z" fill="none" stroke="#FFE5B4" stroke-width="3"/>
      <line x1="42" y1="38" x2="42" y2="62" stroke="#FFE5B4" stroke-width="4" stroke-linecap="round"/>
    `
  },
  {
    id: 'almajed',
    bg: '#064E3B',
    primary: '#FBBF24',
    secondary: '#FFFFFF',
    text: 'ALMAJED 4 OUD',
    ar: 'الماجد للعود',
    symbol: `
      <!-- Almajed Vintage Crest & Year 1956 -->
      <circle cx="50" cy="48" r="24" fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-dasharray="2 3"/>
      <path d="M38 52 C42 42 58 42 62 52 C58 60 42 60 38 52 Z" fill="#FBBF24"/>
      <circle cx="50" cy="38" r="4" fill="#FDE68A"/>
      <path d="M46 30 L50 24 L54 30 Z" fill="#FBBF24"/>
    `
  },
  {
    id: 'samam',
    bg: '#27170E',
    primary: '#E0A96D',
    secondary: '#FFFFFF',
    text: 'SAMAM',
    ar: 'صمام',
    symbol: `
      <!-- Samam Calligraphic Crest -->
      <path d="M34 50 C34 40 46 34 50 42 C54 34 66 40 66 50 C66 62 50 68 50 68 C50 68 34 62 34 50 Z" fill="none" stroke="#E0A96D" stroke-width="3"/>
      <circle cx="50" cy="50" r="5" fill="#E0A96D"/>
      <circle cx="50" cy="30" r="3" fill="#F5D0A9"/>
    `
  },
  {
    id: 'reef',
    bg: '#18181B',
    primary: '#E4D5B7',
    secondary: '#FFFFFF',
    text: 'REEF',
    ar: 'عطور ريف',
    symbol: `
      <!-- Reef Minimalist Luxury Monogram -->
      <path d="M36 34 H54 C60 34 64 38 64 44 C64 50 60 54 54 54 H44 V66 H36 Z" fill="#E4D5B7"/>
      <line x1="52" y1="54" x2="64" y2="66" stroke="#E4D5B7" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="24" r="2.5" fill="#E4D5B7"/>
    `
  },
  {
    id: 'lattafa',
    bg: '#1C1917',
    primary: '#D97706',
    secondary: '#FEF3C7',
    text: 'LATTAFA',
    ar: 'لطافة',
    symbol: `
      <!-- Lattafa Golden Gazelle / Deer Antlers -->
      <path d="M50 64 V48 M42 32 C46 38 48 44 50 48 C52 44 54 38 58 32 M36 36 C42 40 46 44 50 48 M64 36 C58 40 54 44 50 48" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="66" r="3" fill="#FDE68A"/>
    `
  },
  {
    id: 'asq',
    bg: '#1E1B18',
    primary: '#D4AF37',
    secondary: '#FFFFFF',
    text: 'ASQ',
    ar: 'عبد الصمد القرشي',
    symbol: `
      <!-- ASQ Royal Seal & Twin Swords Motif -->
      <circle cx="50" cy="48" r="22" fill="none" stroke="#D4AF37" stroke-width="2"/>
      <path d="M40 58 L50 36 L60 58 Z" fill="none" stroke="#FFE5B4" stroke-width="2.5"/>
      <line x1="36" y1="52" x2="64" y2="52" stroke="#D4AF37" stroke-width="2"/>
      <circle cx="50" cy="32" r="3" fill="#D4AF37"/>
    `
  },
  {
    id: 'rasasi',
    bg: '#0F172A',
    primary: '#38BDF8',
    secondary: '#FFFFFF',
    text: 'RASASI',
    ar: 'الرصاصي',
    symbol: `
      <!-- Rasasi Majestic Falcon -->
      <path d="M50 26 C44 32 38 42 38 54 C44 52 50 54 50 64 C50 54 56 52 62 54 C62 42 56 32 50 26 Z" fill="#38BDF8"/>
      <circle cx="50" cy="34" r="3" fill="#FFFFFF"/>
    `
  },
  {
    id: 'arabian-oud',
    bg: '#1C1917',
    primary: '#C5A880',
    secondary: '#FFFFFF',
    text: 'ARABIAN OUD',
    ar: 'العربية للعود',
    symbol: `
      <!-- Arabian Oud Intertwined Calligraphic A -->
      <path d="M34 64 L46 32 H54 L66 64 H58 L55 56 H45 L42 64 Z M47 50 H53 L50 40 Z" fill="#C5A880"/>
      <circle cx="50" cy="24" r="3" fill="#FFE5B4"/>
    `
  },
  {
    id: 'oud-elite',
    bg: '#111827',
    primary: '#A855F7',
    secondary: '#FFFFFF',
    text: 'OUD ELITE',
    ar: 'نخبة العود',
    symbol: `
      <!-- Oud Elite Diamond Crest -->
      <path d="M50 24 L70 42 L50 72 L30 42 Z" fill="none" stroke="#A855F7" stroke-width="3"/>
      <path d="M30 42 H70 M50 24 L42 42 L50 72 M50 24 L58 42 L50 72" stroke="#C084FC" stroke-width="1.5"/>
    `
  },
  {
    id: 'al-rehab',
    bg: '#064E3B',
    primary: '#34D399',
    secondary: '#FFFFFF',
    text: 'AL REHAB',
    ar: 'الرحاب',
    symbol: `
      <!-- Al Rehab Pure Drop & Leaves -->
      <path d="M50 26 C50 26 34 46 34 56 C34 66 42 72 50 72 C58 72 66 66 66 56 C66 46 50 26 50 26 Z" fill="#34D399"/>
      <path d="M50 36 C50 36 42 50 42 56 C42 62 46 64 50 64 C54 64 58 62 58 56 C58 50 50 36 50 36 Z" fill="#064E3B"/>
    `
  },
  {
    id: 'assaf',
    bg: '#1E1B18',
    primary: '#D4AF37',
    secondary: '#FFFFFF',
    text: 'ASSAF',
    ar: 'عساف',
    symbol: `
      <!-- Assaf Royal Crown Motif -->
      <path d="M32 60 L36 40 L46 50 L50 34 L54 50 L64 40 L68 60 Z" fill="#D4AF37"/>
      <circle cx="50" cy="30" r="3" fill="#FFE5B4"/>
      <rect x="32" y="62" width="36" height="4" rx="2" fill="#D4AF37"/>
    `
  },
  {
    id: 'laverne',
    bg: '#18181B',
    primary: '#C5A880',
    secondary: '#FFFFFF',
    text: 'LAVERNE',
    ar: 'لافيرن',
    symbol: `
      <!-- Laverne Four-Petal Flower Motif -->
      <circle cx="50" cy="40" r="9" fill="#C5A880"/>
      <circle cx="50" cy="56" r="9" fill="#C5A880"/>
      <circle cx="42" cy="48" r="9" fill="#C5A880"/>
      <circle cx="58" cy="48" r="9" fill="#C5A880"/>
      <circle cx="50" cy="48" r="5" fill="#18181B"/>
    `
  },
  {
    id: 'dokhoun',
    bg: '#312E81',
    primary: '#F59E0B',
    secondary: '#FFFFFF',
    text: 'DOKHOUN',
    ar: 'دخون الإماراتية',
    symbol: `
      <!-- Royal Mabkhara (Incense Burner) -->
      <path d="M38 66 H62 L58 48 H42 Z" fill="#F59E0B"/>
      <path d="M42 48 L36 34 H64 L58 48 Z" fill="#FBBF24"/>
      <path d="M46 30 C46 22 50 20 50 20 C50 20 54 22 54 30" stroke="#FFE5B4" stroke-width="2" fill="none"/>
    `
  },
  {
    id: 'afnan',
    bg: '#18181B',
    primary: '#F3F4F6',
    secondary: '#C5A880',
    text: 'AFNAN',
    ar: 'أفنان',
    symbol: `
      <!-- Afnan Geometric Star Monogram -->
      <polygon points="50,22 58,38 76,40 62,52 66,70 50,60 34,70 38,52 24,40 42,38" fill="none" stroke="#C5A880" stroke-width="2.5"/>
      <circle cx="50" cy="48" r="6" fill="#F3F4F6"/>
    `
  },
  {
    id: 'fragrance-world',
    bg: '#0F172A',
    primary: '#38BDF8',
    secondary: '#FFFFFF',
    text: 'FRAGRANCE WORLD',
    ar: 'فراجرانس وورلد',
    symbol: `
      <!-- Globe with Perfume Bottle -->
      <circle cx="50" cy="48" r="20" fill="none" stroke="#38BDF8" stroke-width="2.5"/>
      <ellipse cx="50" cy="48" rx="10" ry="20" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
      <line x1="30" y1="48" x2="70" y2="48" stroke="#38BDF8" stroke-width="1.5"/>
    `
  },
  {
    id: 'zimaya',
    bg: '#172554',
    primary: '#93C5FD',
    secondary: '#FFFFFF',
    text: 'ZIMAYA',
    ar: 'زمايا',
    symbol: `
      <!-- Zimaya Stylized Z -->
      <path d="M34 34 H66 L38 62 H66" fill="none" stroke="#93C5FD" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="62" cy="34" r="3" fill="#FFFFFF"/>
    `
  },
  {
    id: 'banafa',
    bg: '#451A03',
    primary: '#F59E0B',
    secondary: '#FFFFFF',
    text: 'BANAFA',
    ar: 'بنافع للعود',
    symbol: `
      <!-- Banafa Traditional Emblem -->
      <circle cx="50" cy="48" r="22" fill="none" stroke="#F59E0B" stroke-width="3"/>
      <path d="M42 56 C42 44 58 44 58 56" fill="none" stroke="#FDE68A" stroke-width="3"/>
      <circle cx="50" cy="38" r="4" fill="#F59E0B"/>
    `
  },
  {
    id: 'al-ezz',
    bg: '#292524',
    primary: '#D97706',
    secondary: '#FFFFFF',
    text: 'AL EZZ',
    ar: 'العز للعود',
    symbol: `
      <!-- Al Ezz Agarwood Scent Waves -->
      <path d="M40 64 C40 50 60 48 60 34 M50 64 C50 54 62 50 62 40 M34 50 C38 42 46 40 46 32" stroke="#D97706" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="24" r="3" fill="#FCD34D"/>
    `
  },
  {
    id: 'khadlaj',
    bg: '#042F2E',
    primary: '#2DD4BF',
    secondary: '#FFFFFF',
    text: 'KHADLAJ',
    ar: 'خدلج',
    symbol: `
      <!-- Khadlaj Signature Leaf & Drop -->
      <path d="M50 26 C36 40 36 60 50 70 C64 60 64 40 50 26 Z" fill="none" stroke="#2DD4BF" stroke-width="3"/>
      <line x1="50" y1="36" x2="50" y2="64" stroke="#2DD4BF" stroke-width="2"/>
    `
  },
  {
    id: 'labonair',
    bg: '#2E1065',
    primary: '#C084FC',
    secondary: '#FFFFFF',
    text: 'LABONAIR',
    ar: 'لابونير',
    symbol: `
      <!-- Labonair Chic Monogram -->
      <path d="M36 34 V64 H58" fill="none" stroke="#C084FC" stroke-width="4" stroke-linecap="round"/>
      <circle cx="58" cy="44" r="10" fill="none" stroke="#E9D5FF" stroke-width="3"/>
    `
  },
  {
    id: 'thunayan',
    bg: '#1C1917',
    primary: '#EAB308',
    secondary: '#FFFFFF',
    text: 'THUNAYAN',
    ar: 'ثنيان',
    symbol: `
      <!-- Thunayan Royal Monogram T -->
      <path d="M34 36 H66 M50 36 V64" stroke="#EAB308" stroke-width="5" stroke-linecap="round"/>
      <circle cx="34" cy="30" r="2.5" fill="#FEF08A"/>
      <circle cx="66" cy="30" r="2.5" fill="#FEF08A"/>
    `
  },
  {
    id: 'sadr-al-khaleej',
    bg: '#083344',
    primary: '#38BDF8',
    secondary: '#FFFFFF',
    text: 'SADR AL KHALEEJ',
    ar: 'صدر الخليج',
    symbol: `
      <!-- Gulf Pearl Waves -->
      <path d="M32 54 C38 48 44 60 50 54 C56 48 62 60 68 54" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="38" r="8" fill="#F0F9FF"/>
      <circle cx="50" cy="38" r="4" fill="#38BDF8"/>
    `
  },
  {
    id: 'shams',
    bg: '#451A03',
    primary: '#FBBF24',
    secondary: '#FFFFFF',
    text: 'SHAMS',
    ar: 'شمس',
    symbol: `
      <!-- Radiant Golden Sunburst -->
      <circle cx="50" cy="48" r="12" fill="#FBBF24"/>
      <path d="M50 24 V30 M50 66 V72 M26 48 H32 M68 48 H74 M34 32 L38 36 M62 60 L66 64 M34 64 L38 60 M62 36 L66 32" stroke="#FDE68A" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'osma',
    bg: '#14532D',
    primary: '#86EFAC',
    secondary: '#FFFFFF',
    text: 'OSMA',
    ar: 'أوسما',
    symbol: `
      <!-- Osma Botanical Laurel Branch -->
      <circle cx="50" cy="48" r="18" fill="none" stroke="#86EFAC" stroke-width="2"/>
      <path d="M50 34 C44 42 44 54 50 62 C56 54 56 42 50 34 Z" fill="#86EFAC"/>
    `
  },
  {
    id: 'al-dakheel',
    bg: '#1C1917',
    primary: '#A3E635',
    secondary: '#FFFFFF',
    text: 'AL DAKHEEL',
    ar: 'الدخيل للعود',
    symbol: `
      <!-- Al Dakheel Palm & Heritage Crest -->
      <path d="M50 64 V40 M50 40 C44 34 38 38 34 46 M50 40 C56 34 62 38 66 46 M50 40 C46 30 50 24 50 24 C50 24 54 30 50 40" stroke="#A3E635" stroke-width="3" stroke-linecap="round" fill="none"/>
    `
  }
];

function generateSVG(b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-${b.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${b.bg}" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <radialGradient id="glow-${b.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${b.primary}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${b.primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Circular Outer Medallion -->
  <circle cx="50" cy="50" r="48" fill="url(#grad-${b.id})" stroke="${b.primary}" stroke-width="1.8"/>
  <circle cx="50" cy="50" r="44" fill="none" stroke="${b.primary}" stroke-width="0.75" stroke-dasharray="2 2" opacity="0.7"/>
  <circle cx="50" cy="50" r="38" fill="url(#glow-${b.id})"/>

  <!-- Official Brand Crest Motif -->
  <g transform="translate(0, -4)">
    ${b.symbol}
  </g>

  <!-- Typography Brand Mark -->
  <text x="50" y="86" font-family="'Cinzel', 'Trajan Pro', serif, 'Amiri'" font-size="7.5" font-weight="900" fill="${b.primary}" text-anchor="middle" letter-spacing="1">${b.text}</text>
</svg>`;
}

for (const b of brands) {
  const filePath = path.join(brandsDir, `${b.id}.svg`);
  fs.writeFileSync(filePath, generateSVG(b).trim());
  console.log(`Generated: ${b.id}.svg`);
}

console.log('Finished generating 26 luxury brand SVG logos!');
