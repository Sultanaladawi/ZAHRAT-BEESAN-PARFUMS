const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rawProducts = JSON.parse(fs.readFileSync('data/full_53_products.json', 'utf8'));
const masterBgPath = path.join(__dirname, '..', 'public', 'images', 'ghalati_master_bg.jpg');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

// Dictionary of English translations for notes and overviews
const translations = {
  'rasayil-shawq': {
    titleEn: 'Rasayil Shawq Eau De Parfum',
    overviewEn: 'Rasayil Shawq takes you on an emotional journey of deep affection and authentic passion. Featuring an enchanting blend of luscious fruits, golden caramel, and exquisite florals.',
    openingEn: 'Strawberry, Sweet Caramel, Ripe Peach',
    heartEn: 'Precious Saffron, Warm Amber, Damask Rose',
    baseEn: 'Patchouli, Creamy Vanilla, Supple Leather',
    prominentEn: 'Strawberry, Vanilla, Amber, Peach',
    typeEn: 'Modern Oriental Eau De Parfum'
  },
  'just-oud': {
    titleEn: 'Just Oud Eau De Parfum',
    overviewEn: 'An intense, opulent oud experience designed for true connoisseurs of aristocratic Arabian scents, featuring smokey agarwood enriched with warm spices and precious resins.',
    openingEn: 'Smoked Incense, Cardamom, Bergamot',
    heartEn: 'Aged Agarwood (Oud), Cedar, Leather Accords',
    baseEn: 'Royal Amber, Pure Musk, Guaiac Wood',
    prominentEn: 'Royal Oud, Smoked Amber, Incense',
    typeEn: 'Opulent Woody Oriental Eau De Parfum'
  },
  'perfume-1932': {
    titleEn: '1932 Vintage Eau De Parfum',
    overviewEn: 'A timeless homage commemorating historical grandeur, balancing vintage herbal aristocracy with rich woods and smooth amber.',
    openingEn: 'Calabrian Bergamot, Pink Peppercorn, Sage',
    heartEn: 'Florentine Iris, White Cedar, Vetiver',
    baseEn: 'Warm Tonka, Golden Amber, Leather',
    prominentEn: 'Bergamot, Iris Butter, Cedarwood',
    typeEn: 'Aristocratic Vintage Eau De Parfum'
  },
  'mountain-leather': {
    titleEn: 'Mountain Leather Eau De Parfum',
    overviewEn: 'Inspired by misty mountainous landscapes and windswept peaks, offering an invigorating leather fragrance underscored by fresh green accords and refined woods.',
    openingEn: 'Juniper Berries, Crisp Apple, Wild Thyme',
    heartEn: 'Smoked Birch, Tuscan Leather, Iris',
    baseEn: 'Oakmoss, Dry Woods, White Musk',
    prominentEn: 'Tuscan Leather, Smoked Birch, Juniper',
    typeEn: 'Leather & Woody Eau De Parfum'
  },
  'perfume-2016': {
    titleEn: '2016 Signature Eau De Parfum',
    overviewEn: 'A modern, dynamic tribute celebrating contemporary luxury and vibrant energy, brimming with effervescent citrus and warm woods.',
    openingEn: 'Sparkling Grapefruit, Green Mandarin, Cardamom',
    heartEn: 'Sea Breeze Accords, Jasmine, Clary Sage',
    baseEn: 'Precious Ambergris, Cedarwood, White Musk',
    prominentEn: 'Grapefruit, Ambergris, Modern Woods',
    typeEn: 'Dynamic Fresh Woody Eau De Parfum'
  },
  'ambitious': {
    titleEn: 'Ambitious Eau De Parfum',
    overviewEn: 'Crafted for leaders with unwavering confidence, featuring bold spices, magnetic resins, and rich dry woods that command instant admiration.',
    openingEn: 'Nutmeg, Black Pepper, Mandarin',
    heartEn: 'Smoked Frankincense, Cashmere Wood, Lavender',
    baseEn: 'Sandalwood, Amber Resin, Tonka Bean',
    prominentEn: 'Cashmere Wood, Incense, Black Pepper',
    typeEn: 'Spicy Woody Eau De Parfum'
  },
  'sublime-woods': {
    titleEn: 'Sublime Woods Eau De Parfum',
    overviewEn: 'An immersion into ancient enchanted forests, combining creamy sandalwood, earthy vetiver, and smoky cedarwood in a harmonious, serene blend.',
    openingEn: 'Crisp Bergamot, Cypress, Pink Pepper',
    heartEn: 'Atlas Cedar, Indonesian Patchouli, Violet Leaves',
    baseEn: 'Sandalwood, Haitian Vetiver, Gentle Amber',
    prominentEn: 'Cedarwood, Sandalwood, Vetiver',
    typeEn: 'Prestige Woody Eau De Parfum'
  },
  'perfume-1985': {
    titleEn: '1985 Royal Eau De Parfum',
    overviewEn: 'A golden classic encapsulating retro charm and timeless sophistication with spicy florality and velvety amber notes.',
    openingEn: 'Bitter Orange, Coriander, Cardamom',
    heartEn: 'Bulgarian Rose, Clove, Orange Blossom',
    baseEn: 'Golden Amber, Sandalwood, Benzoin Resin',
    prominentEn: 'Spiced Rose, Golden Amber, Benzoin',
    typeEn: 'Classic Royal Oriental Eau De Parfum'
  },
  'absolute-musk': {
    titleEn: 'Absolute Musk Eau De Parfum',
    overviewEn: 'A pure, crystalline cloud of immaculate white musk, elevated by subtle hints of powdery iris and creamy cotton blossoms.',
    openingEn: 'Dewy Cotton Blossom, White Peach, Freesia',
    heartEn: 'Florentine Iris, Lily of the Valley, Heliotrope',
    baseEn: 'Pristine White Musk, Sandalwood, Vanilla Pod',
    prominentEn: 'White Musk, Iris, Cotton Blossom',
    typeEn: 'Pure Powdery Musk Eau De Parfum'
  },
  'sublime-flowers': {
    titleEn: 'Sublime Flowers Eau De Parfum',
    overviewEn: 'A dazzling bouquet of radiant spring blossoms wrapped in gentle fruity undertones and delicate sheer woods.',
    openingEn: 'Mandarin Zest, Pear Blossom, Dewy Greens',
    heartEn: 'Sambac Jasmine, Royal Peony, Orange Flower',
    baseEn: 'Blonde Woods, Sheer Musk, Amber Crystals',
    prominentEn: 'Peony, Sambac Jasmine, Pear Blossom',
    typeEn: 'Radiant Floral Eau De Parfum'
  },
  'eloquent': {
    titleEn: 'Eloquent Eau De Parfum',
    overviewEn: 'Sophisticated eloquence captured in scent, blending uplifting citrus with delicate florals and refined cedar.',
    openingEn: 'Sicilian Lemon, Bergamot, Pink Peppercorn',
    heartEn: 'White Freesia, Jasmine Petals, Clary Sage',
    baseEn: 'Virginia Cedarwood, Musk, Ambergris',
    prominentEn: 'Bergamot, White Freesia, Cedarwood',
    typeEn: 'Fresh Floral Woody Eau De Parfum'
  },
  'peach-musk': {
    titleEn: 'Peach Musk Eau De Parfum',
    overviewEn: 'A delightful fusion of sun-drenched golden peaches and silky white musk, creating a playful yet luxurious aura of sweetness and purity.',
    openingEn: 'Juicy White Peach, Red Berries, Citrus Spark',
    heartEn: 'Peach Blossom, Star Jasmine, Rose Petals',
    baseEn: 'Velvety White Musk, Sweet Vanilla, Light Amber',
    prominentEn: 'Juicy Peach, Velvety Musk, Vanilla',
    typeEn: 'Fruity Musk Eau De Parfum'
  },
  'just-amber': {
    titleEn: 'Just Amber Eau De Parfum',
    overviewEn: 'A warm, hypnotic amber masterpiece glowing with golden resin, sweet vanilla, and exotic balsam.',
    openingEn: 'Cinnamon Bark, Sweet Nutmeg, Bergamot',
    heartEn: 'Golden Amber, Benzoin, Labdanum',
    baseEn: 'Madagascar Vanilla, Patchouli, Sandalwood',
    prominentEn: 'Golden Amber, Labdanum, Vanilla',
    typeEn: 'Warm Resinous Oriental Eau De Parfum'
  },
  'carmine-soul': {
    titleEn: 'Carmine Soul Eau De Parfum',
    overviewEn: 'A passionate crimson soul composed of velvety deep roses, mysterious incenses, and dark woody undertones.',
    openingEn: 'Saffron, Black Currant, Pink Peppercorn',
    heartEn: 'Damask Rose, Incense, Dark Plum',
    baseEn: 'Smoked Patchouli, Amber, Leather',
    prominentEn: 'Dark Rose, Saffron, Smoked Patchouli',
    typeEn: 'Intense Floral Oriental Eau De Parfum'
  },
  'dama': {
    titleEn: 'Dama Royal Eau De Parfum',
    overviewEn: 'An aristocratic feminine fragrance radiating grace and majesty, weaving together royal florals, subtle gourmand notes, and silky woods.',
    openingEn: 'Candied Bergamot, Sweet Almond, Raspberry',
    heartEn: 'Turkish Rose, Magnolia, Orange Blossom',
    baseEn: 'Cashmeran, Madagascar Vanilla, White Musk',
    prominentEn: 'Turkish Rose, Sweet Almond, Cashmeran',
    typeEn: 'Royal Floral Gourmand Eau De Parfum'
  },
  'utopia-essence': {
    titleEn: 'Utopia Essence Eau De Parfum',
    overviewEn: 'An ethereal paradise of rare florals and uplifting marine-fruity nuances resting on a foundation of warm sunlit woods.',
    openingEn: 'Sea Breeze Accords, Green Apple, Italian Lemon',
    heartEn: 'White Lily, Jasmine Sambac, Violet Leaves',
    baseEn: 'Solar Amber, Cedarwood, Sheer Musk',
    prominentEn: 'Sea Breeze, White Lily, Solar Amber',
    typeEn: 'Fresh Ethereal Floral Eau De Parfum'
  },
  'exotic-wood': {
    titleEn: 'Exotic Wood Eau De Parfum',
    overviewEn: 'An expedition into tropical forests featuring exotic precious timbers, dark spices, and enigmatic resins.',
    openingEn: 'Cardamom, Coriander, Brazilian Orange',
    heartEn: 'Guaiac Wood, Smoked Birch, Indonesian Teak',
    baseEn: 'Ebony Wood, Sandalwood, Dark Amber',
    prominentEn: 'Guaiac Wood, Teak, Cardamom',
    typeEn: 'Deep Exotic Woody Eau De Parfum'
  },
  'rose-intense': {
    titleEn: 'Rose Intense Eau De Parfum',
    overviewEn: 'A captivating celebration of the queen of flowers, presenting concentrated Damascus rose petals enriched with sweet praline and amber.',
    openingEn: 'Dewy Morning Rose, Sparkling Bergamot, Lychee',
    heartEn: 'Centifolia Rose Absolute, Praline, Jasmine',
    baseEn: 'Amber Crystals, Bourbon Vanilla, White Musk',
    prominentEn: 'Rose Absolute, Praline, Amber Crystals',
    typeEn: 'Intense Gourmand Rose Eau De Parfum'
  },
  'raspberry-musk': {
    titleEn: 'Raspberry Musk Eau De Parfum',
    overviewEn: 'A delicious harmony of wild ripe raspberries and clean, comforting white musk that leaves an irresistible impression.',
    openingEn: 'Wild Raspberry, Blackberry, Sweet Mandarin',
    heartEn: 'Peony, Rose Water, Cotton Candy Accords',
    baseEn: 'Silky White Musk, Vanilla, Cedarwood',
    prominentEn: 'Wild Raspberry, White Musk, Rose Water',
    typeEn: 'Sweet Fruity Musk Eau De Parfum'
  },
  'cherry-musk': {
    titleEn: 'Cherry Musk Eau De Parfum',
    overviewEn: 'Succulent black cherries dipped in velvet musk and light almond facets, exuding modern charm and sweet allure.',
    openingEn: 'Dark Morello Cherry, Bitter Almond, Citrus',
    heartEn: 'Cherry Blossom, Jasmine, Plum Nectar',
    baseEn: 'Cloud of White Musk, Tonka Bean, Sandalwood',
    prominentEn: 'Morello Cherry, Bitter Almond, Velvet Musk',
    typeEn: 'Gourmand Fruity Musk Eau De Parfum'
  },
  'vintage': {
    titleEn: 'Eau De Vintage Prestige',
    overviewEn: 'Signed by master perfumer Olaf Larsen, Vintage is a tribute to noble elegance featuring zesty bergamot, saffron, Florentine iris butter, and vetiver.',
    openingEn: 'Citrus Bergamot, Spicy Ginger, Precious Saffron, Rhubarb',
    heartEn: 'Fragrant Damask Rose, Royal Jasmine, Rich Iris Butter, Orange Blossom',
    baseEn: 'Earth Vetiver, Sweet Tonka Bean, Warm Musks, Patchouli',
    prominentEn: 'Bergamot, Iris Butter, Rich Patchouli',
    typeEn: 'Prestige Masterpiece Eau De Parfum'
  },
  'iris-musk': {
    titleEn: 'Iris Musk Eau De Parfum',
    overviewEn: 'A powdery, royal masterpiece celebrating noble Tuscan iris wrapped in whisper-soft white musk and subtle vanilla.',
    openingEn: 'Bergamot, Neroli, Powder Accords',
    heartEn: 'Tuscan Iris Butter, Violet Blossom, Heliotrope',
    baseEn: 'Prestige White Musk, Tonka Bean, Cedarwood',
    prominentEn: 'Tuscan Iris, White Musk, Violet Blossom',
    typeEn: 'Powdery Floral Musk Eau De Parfum'
  },
  'serenade': {
    titleEn: 'Serenade Royal Eau De Parfum',
    overviewEn: 'A melodic symphony of crisp apple, aromatic lavender, geranium, and deep woods that creates an unforgettable evening aura.',
    openingEn: 'Crisp Green Apple, Bergamot, Pink Pepper',
    heartEn: 'French Lavender, Royal Geranium, Cardamom',
    baseEn: 'Patchouli, Atlas Cedarwood, Golden Amber',
    prominentEn: 'Crisp Apple, Lavender, Cedarwood',
    typeEn: 'Royal Aromatic Woody Eau De Parfum'
  },
  'utopia-gist': {
    titleEn: 'Utopia Gist Eau De Parfum',
    overviewEn: 'The essence of pure luxury, combining sparkling pineapple and bergamot with noble oakmoss and smoky dry woods.',
    openingEn: 'Golden Pineapple, Bergamot, Black Currant',
    heartEn: 'Moroccan Jasmine, Birch Wood, Rose',
    baseEn: 'Oakmoss, Ambergris, Bourbon Vanilla',
    prominentEn: 'Pineapple, Bergamot, Oakmoss, Dry Woods',
    typeEn: 'Chypre Fruity Royal Eau De Parfum'
  },
  'eternal-passion': {
    titleEn: 'Eternal Passion Eau De Parfum',
    overviewEn: 'A fiery, long-lasting passion captured in exotic spices, intoxicating dark florals, and smoldering amber resins.',
    openingEn: 'Saffron Threads, Cardamom, Mandarin',
    heartEn: 'Turkish Rose, Smoked Incense, Leather Accords',
    baseEn: 'Oud Wood, Warm Amber, Patchouli, Vanilla',
    prominentEn: 'Saffron, Smoked Incense, Warm Amber',
    typeEn: 'Passionate Oriental Eau De Parfum'
  },
  'mont-dor': {
    titleEn: 'Mont Dor Royal Eau De Parfum',
    overviewEn: 'A golden mountain of majesty featuring radiant citrus, precious golden saffron, honeyed woods, and imperial amber.',
    openingEn: 'Sparkling Citrus, Royal Saffron, Neroli',
    heartEn: 'Cedarwood, Cashmere Wood, Honey Blossom',
    baseEn: 'Imperial Amber, White Musk, Sandalwood',
    prominentEn: 'Royal Saffron, Cashmere Wood, Imperial Amber',
    typeEn: 'Imperial Golden Oriental Eau De Parfum'
  },
  'boudoir': {
    titleEn: 'Boudoir Royal Eau De Parfum',
    overviewEn: 'Intimate, velvety elegance inspired by royal boudoirs, blending sweet spices, powdery florals, and sensual musk.',
    openingEn: 'Almond Nectar, Pink Pepper, Peach Peel',
    heartEn: 'Damask Rose, Iris, Jasmine Sambac',
    baseEn: 'Madagascar Vanilla, Cashmeran, Soft Musk',
    prominentEn: 'Almond Nectar, Damask Rose, Cashmeran',
    typeEn: 'Sensual Powdery Oriental Eau De Parfum'
  },
  'first-impression': {
    titleEn: 'First Impression Eau De Parfum',
    overviewEn: 'An unforgettable opening statement defined by vibrant citrus, modern aromatics, and rich woody foundations.',
    openingEn: 'Italian Lemon, Mandarin, Marine Accords',
    heartEn: 'Rosemary, Lavender, Geranium Petals',
    baseEn: 'Cedarwood, Patchouli, Ambergris',
    prominentEn: 'Italian Lemon, Fresh Aromatics, Cedarwood',
    typeEn: 'Modern Fresh Aromatic Eau De Parfum'
  },
  'seraj': {
    titleEn: 'Seraj Royal Eau De Parfum',
    overviewEn: 'A radiant beacon of light and warmth illuminating the night with golden spices, noble oud, and sweet resins.',
    openingEn: 'Cinnamon, Nutmeg, Sweet Bergamot',
    heartEn: 'Incense, Royal Oud, Honeyed Tobacco',
    baseEn: 'Amber Resin, Sandalwood, Pure Vanilla',
    prominentEn: 'Royal Oud, Incense, Cinnamon, Amber',
    typeEn: 'Radiant Spicy Amber Eau De Parfum'
  },
  'cartage-velours': {
    titleEn: 'Cartage Velours Royal Eau De Parfum',
    overviewEn: 'Velvety royal luxury inspired by Carthage majesty, uniting deep roses, smooth cashmere, and comforting vanilla musk.',
    openingEn: 'Plum, Pink Pepper, Bergamot',
    heartEn: 'Velvet Rose, Jasmine, Cashmere Wood',
    baseEn: 'Amber, Bourbon Vanilla, Silky Musk',
    prominentEn: 'Velvet Rose, Cashmere Wood, Amber',
    typeEn: 'Velvety Royal Floral Eau De Parfum'
  },
  'most-wanted': {
    titleEn: 'Most Wanted Royal Eau De Parfum',
    overviewEn: 'The epitome of attraction and distinction, built upon fiery ginger, decadent toffee caramel, and smoky amber woods.',
    openingEn: 'Red Ginger, Cardamom, Mandarin Zest',
    heartEn: 'Gourmand Toffee, Lavender, Cinnamon',
    baseEn: 'Amber Wood, Cedar, Tonka Bean',
    prominentEn: 'Red Ginger, Toffee Accord, Amber Wood',
    typeEn: 'Magnetic Gourmand Woody Eau De Parfum'
  },
  'cartage-etoile': {
    titleEn: 'Cartage Etoile Royal Eau De Parfum',
    overviewEn: 'A starry, radiant oriental gem shimmering with starry white florals, solar citrus, and golden amber.',
    openingEn: 'Solar Mandarin, Star Anise, Neroli',
    heartEn: 'Star Jasmine, Orange Blossom, Ylang-Ylang',
    baseEn: 'Golden Amber, Sandalwood, White Musk',
    prominentEn: 'Star Jasmine, Solar Mandarin, Golden Amber',
    typeEn: 'Radiant Oriental Floral Eau De Parfum'
  },
  'silk-essence': {
    titleEn: 'Silk Essence Royal Eau De Parfum',
    overviewEn: 'Silky smooth opulence caressing the skin with delicate florals, creamy sandalwood, and sheer white musk.',
    openingEn: 'White Freesia, Lychee, Bergamot',
    heartEn: 'Silk Peony, Lily of the Valley, Magnolia',
    baseEn: 'Creamy Sandalwood, White Musk, Heliotrope',
    prominentEn: 'Silk Peony, Creamy Sandalwood, White Musk',
    typeEn: 'Silky Smooth Floral Eau De Parfum'
  },
  'amber-oud': {
    titleEn: 'Amber Oud Royal Eau De Parfum',
    overviewEn: 'A majestic union of golden amber and noble Arabian oud, creating an enduring aura of supreme regal prestige.',
    openingEn: 'Saffron, Thyme, Smoked Bergamot',
    heartEn: 'Precious Agarwood, Jasmine, Rose',
    baseEn: 'Rich Golden Amber, Leather, Vanilla, Cedar',
    prominentEn: 'Noble Oud, Golden Amber, Saffron',
    typeEn: 'Regal Amber Oud Eau De Parfum'
  },
  'sandouq-albarqa': {
    titleEn: 'Sandouq Al-Barqa Luxury Collection Box',
    overviewEn: 'An opulent royal presentation box containing a collection of prestige fragrances and scented creations celebrating authentic heritage.',
    openingEn: 'Aromatic Freshness, Royal Spices, Citrus',
    heartEn: 'Precious Florals, Woody Accords, Amber',
    baseEn: 'Agarwood, Musk, Sandalwood',
    prominentEn: 'Prestige Perfumes & Heritage Scented Treasures',
    typeEn: 'Luxury Heritage Collection Box'
  },
  'cartage-noble': {
    titleEn: 'Cartage Noble Royal Eau De Parfum',
    overviewEn: 'Noble stature captured in royal ingredients: aristocratic iris, smoky vetiver, and dark regal amber.',
    openingEn: 'Cardamom, Bergamot, Pink Peppercorn',
    heartEn: 'Noble Iris, Cedarwood, Clary Sage',
    baseEn: 'Smoky Vetiver, Patchouli, Dark Amber',
    prominentEn: 'Noble Iris, Smoky Vetiver, Dark Amber',
    typeEn: 'Noble Woody Aristocratic Eau De Parfum'
  },
  'package-cartage-noble': {
    titleEn: 'Cartage Noble Luxury Package',
    overviewEn: 'An exclusive gift package featuring the acclaimed Cartage Noble fragrance accompanied by complementary scented luxuries.',
    openingEn: 'Cardamom, Bergamot, Pink Peppercorn',
    heartEn: 'Noble Iris, Cedarwood, Clary Sage',
    baseEn: 'Smoky Vetiver, Patchouli, Dark Amber',
    prominentEn: 'Cartage Noble Fragrance & Luxury Accompaniments',
    typeEn: 'Exclusive Luxury Gift Package'
  },
  'package-cartage-etoile': {
    titleEn: 'Cartage Etoile Luxury Package',
    overviewEn: 'A shining gift set containing Cartage Etoile along with luxurious fragrant pairings.',
    openingEn: 'Solar Mandarin, Star Anise, Neroli',
    heartEn: 'Star Jasmine, Orange Blossom, Ylang-Ylang',
    baseEn: 'Golden Amber, Sandalwood, White Musk',
    prominentEn: 'Cartage Etoile & Starry Fragrant Accords',
    typeEn: 'Exclusive Luxury Gift Package'
  },
  'package-cartage-velours': {
    titleEn: 'Cartage Velours Luxury Package',
    overviewEn: 'A velvety royal package presenting the beloved Cartage Velours perfume in a gift presentation box.',
    openingEn: 'Plum, Pink Pepper, Bergamot',
    heartEn: 'Velvet Rose, Jasmine, Cashmere Wood',
    baseEn: 'Amber, Bourbon Vanilla, Silky Musk',
    prominentEn: 'Cartage Velours & Velvet Rose Accords',
    typeEn: 'Exclusive Luxury Gift Package'
  },
  'bundle-body-musk': {
    titleEn: 'Body Musk Collection Bundle',
    overviewEn: 'An irresistible collection of pure body musks formulated to pamper the skin with gentle freshness and captivating longevity.',
    openingEn: 'Pure Cotton Blossom, Clean Citrus, White Peach',
    heartEn: 'Rose Water, Lily of the Valley, Soft Powders',
    baseEn: 'Pure White Musk, Vanilla Nectar, Light Amber',
    prominentEn: 'Clean Cotton, White Musk, Rose Water',
    typeEn: 'Body Musk Fragrance Set'
  },
  'bundle-al-saada': {
    titleEn: 'Al-Saada Happiness Luxury Bundle',
    overviewEn: 'The Happiness Bundle delivers vibrant joy with a curated trio of upliftings scents designed to brighten every moment.',
    openingEn: 'Sparkling Citrus, Sweet Berries, Fresh Spices',
    heartEn: 'Radiant Florals, Sweet Almond, Orange Blossom',
    baseEn: 'Warm Tonka, Golden Amber, Comforting Musk',
    prominentEn: 'Joyful Citrus, Sweet Berries, Golden Amber',
    typeEn: 'Joyful Luxury Gift Bundle'
  },
  'bundle-discovery': {
    titleEn: 'Discovery Collection Gift Bundle',
    overviewEn: 'The definitive discovery box showcasing Dar Ghalati’s finest signature perfumes, allowing you to explore the spectrum of oriental opulence.',
    openingEn: 'Comprehensive notes of Citrus, Florals, and Spices',
    heartEn: 'Diverse hearts of Rose, Iris, Amber, and Cedar',
    baseEn: 'Prestige bases of Oud, Ambergris, and Royal Musk',
    prominentEn: 'Curated Selection of Bestselling Masterpieces',
    typeEn: 'Discovery Perfume Gift Set'
  },
  'luxury-edition': {
    titleEn: 'Luxury Edition Perfume Set',
    overviewEn: 'A limited luxury edition combining exquisite boutique fragrances crafted for discerning collectors.',
    openingEn: 'Precious Citrus, Saffron, Pink Peppercorn',
    heartEn: 'Damask Rose, Iris Butter, Cashmeran',
    baseEn: 'Agarwood, Amber, White Musk',
    prominentEn: 'Exclusive Luxury Edition Selections',
    typeEn: 'Limited Edition Fragrance Set'
  },
  'bundle-varna-montdor': {
    titleEn: 'Varna & Mont Dor Royal Duo Bundle',
    overviewEn: 'An aristocratic pairing of two royal crown jewels: Varna and Mont Dor, presented together for connoisseurs of timeless elegance.',
    openingEn: 'Precious Saffron, Bergamot, Neroli',
    heartEn: 'Sandalwood, Atlas Cedar, Cashmere Wood',
    baseEn: 'Imperial Amber, Patchouli, Pure Musk',
    prominentEn: 'Varna & Mont Dor Masterpiece Duo',
    typeEn: 'Royal Duo Gift Bundle'
  },
  'bundle-lak-walaha': {
    titleEn: 'For Him & Her Luxury Gift Bundle',
    overviewEn: 'The ultimate couple’s gift set combining a distinguished masculine fragrance with an enchanting feminine creation.',
    openingEn: 'Fresh Bergamot, Pink Pepper, Sweet Mandarins',
    heartEn: 'Velvety Roses, Iris, Warm Spices',
    baseEn: 'Precious Woods, Royal Amber, Silky Musk',
    prominentEn: 'Complementary Masculine & Feminine Scents',
    typeEn: 'Couples Luxury Gift Bundle'
  },
  'bundle-modern': {
    titleEn: 'Modern Heritage Luxury Diorama Bundle',
    overviewEn: 'A breathtaking diorama box presenting Varna, Utopia Gist, and Sandouq Al-Barqa in an illuminated heritage architectural display.',
    openingEn: 'Bergamot, Pineapple, Crisp Apple',
    heartEn: 'Geranium, Lavender, Rose, Clary Sage',
    baseEn: 'Sandalwood, Patchouli, Oakmoss, Amber',
    prominentEn: 'Varna 100ml, Utopia Gist 100ml, Sandouq Al-Barqa 120ml',
    typeEn: 'Illuminated Heritage Diorama Bundle'
  },
  'bundle-daraa': {
    titleEn: 'Daraa Heritage Luxury Diorama Bundle',
    overviewEn: 'Celebrating Saudi folklore and heritage through an architectural diorama box housing Dar Ghalati’s most cherished scents.',
    openingEn: 'Traditional Spices, Bergamot, Green Apple',
    heartEn: 'Desert Roses, Lavender, Saffron, Cedar',
    baseEn: 'Ancient Oud, Smoked Amber, Royal Musk',
    prominentEn: 'Heritage Diorama Showcase with Full-size Bottles',
    typeEn: 'Heritage Diorama Gift Set'
  },
  'bundle-tuwaiq': {
    titleEn: 'Tuwaiq Heritage Luxury Diorama Bundle',
    overviewEn: 'Named after the mighty Tuwaiq Mountains, symbol of Saudi determination and grandeur, featuring towering woody and amber notes.',
    openingEn: 'Fresh Juniper, Mountain Air, Bergamot',
    heartEn: 'Cedar, Smoked Resins, Spiced Leather',
    baseEn: 'Royal Agarwood, Amber, Earthy Vetiver',
    prominentEn: 'Tuwaiq Mountain Heritage Presentation',
    typeEn: 'Heritage Diorama Gift Set'
  },
  'bundle-rawshan': {
    titleEn: 'Rawshan Heritage Luxury Diorama Bundle',
    overviewEn: 'Inspired by traditional Hijazi wooden rawshan architecture, capturing historical warmth and artistic grace.',
    openingEn: 'Cardamom, Mandarin, Sweet Orange Blossom',
    heartEn: 'Damascus Rose, Incense, Cedarwood',
    baseEn: 'Aged Oud, Warm Amber, Sandalwood',
    prominentEn: 'Rawshan Architectural Diorama Presentation',
    typeEn: 'Heritage Diorama Gift Set'
  },
  'bundle-sadu': {
    titleEn: 'Sadu Heritage Luxury Diorama Bundle',
    overviewEn: 'Honoring the UNESCO-inscribed art of traditional Bedouin Sadu weaving, presenting iconic royal perfumes in an artistic diorama.',
    openingEn: 'Desert Spices, Bergamot, Pink Pepper',
    heartEn: 'Geranium, Lavender, Iris, Cedarwood',
    baseEn: 'Sandalwood, Patchouli, Golden Amber',
    prominentEn: 'Sadu Art Heritage Presentation with Full-size Bottles',
    typeEn: 'Heritage Diorama Gift Set'
  },
  'bundle-yamama': {
    titleEn: 'Yamama Heritage Luxury Diorama Bundle',
    overviewEn: 'A tribute to the historic heart of Najd and Al-Yamama, marrying ancient desert pride with contemporary perfumery excellence.',
    openingEn: 'Najdi Dates & Spices, Bergamot, Orange Blossom',
    heartEn: 'Precious Desert Rose, Frankincense, Cashmere Wood',
    baseEn: 'Royal Ambergris, Oud, Sandalwood',
    prominentEn: 'Yamama Heritage Architectural Diorama Presentation',
    typeEn: 'Heritage Diorama Gift Set'
  },
  'honest': {
    titleEn: 'Honest Eau De Parfum',
    overviewEn: 'Crafted by master perfumer Miroslav Petkov, Honest is an intoxicating warm spicy leather perfume balancing feminine sensuality with masculine charisma, driven by leather, warm spices, amber, and patchouli.',
    openingEn: 'Mandarin, Grapefruit, Black Pepper, Pink Pepper, Cinnamon',
    heartEn: 'Cypress, Labdanum, Egyptian Violet Leaves, Marjoram',
    baseEn: 'Haitian Vetiver, Smoked Incense, Patchouli, Rich Leather, Benzoin',
    prominentEn: 'Warm Spices, Labdanum Resin, Smoked Incense, Rich Leather',
    typeEn: 'Warm Spicy Leather Eau De Parfum'
  },
  'package-air-fresheners': {
    titleEn: 'Luxury Air Fresheners Trio Package',
    overviewEn: 'A luxury trio of long-lasting home and linen fresheners from Dar Ghalati, infusing fabrics, living rooms, and hospitality halls with enchanting French and oriental fragrances.',
    openingEn: 'Zesty Citrus, Sparkling Lavender, Fresh Linen',
    heartEn: 'Velvety Roses, Jasmine Petals, Sweet Fruits',
    baseEn: 'Gentle Amber, Pure White Musk, Sandalwood',
    prominentEn: 'Trio of Luxury Home & Linen Ambient Sprays',
    typeEn: 'Luxury Air Freshener Trio'
  }
};

async function downloadBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processSingleBottle(buf, slug) {
  // Border connected BFS to isolate bottle
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  let sumX = 0, count = 0;
  for (let y = Math.round(h * 0.3); y < Math.round(h * 0.7); y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r < 230 || g < 230 || b < 230) {
        sumX += x;
        count++;
      }
    }
  }
  const centerX = count > 0 ? Math.round(sumX / count) : 500;

  const isBg = (x, y) => {
    const idx = (y * w + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    if (r >= 238 && g >= 238 && b >= 238) return true;
    const diff = Math.max(r, g, b) - Math.min(r, g, b);
    if (diff <= 8) {
      if ((x < centerX - 120 || x > centerX + 120) && r >= 90) return true;
      if (y > h * 0.88 && r >= 100) return true;
    }
    return false;
  };

  const visited = new Uint8Array(w * h);
  const queue = [];

  for (let x = 0; x < w; x++) {
    if (isBg(x, 0)) { queue.push(x, 0); visited[x] = 1; }
    if (isBg(x, h - 1)) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
  }
  for (let y = 0; y < h; y++) {
    if (isBg(0, y) && !visited[y * w]) { queue.push(0, y); visited[y * w] = 1; }
    if (isBg(w - 1, y) && !visited[y * w + w - 1]) { queue.push(w - 1, y); visited[y * w + w - 1] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0], ny = neighbors[i][1];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nPos = ny * w + nx;
        if (!visited[nPos] && isBg(nx, ny)) {
          visited[nPos] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      if (visited[pos]) {
        data[pos * 4 + 3] = 0;
      }
    }
  }

  const cleanedPng = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();

  const trimmed = await sharp(cleanedPng).trim().toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join(publicImagesDir, `original_${slug}.png`), trimmed.data);

  const targetH = 515;
  const resized = await sharp(trimmed.data)
    .resize({ height: targetH, kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });

  const bW = resized.info.width;
  const bH = resized.info.height;
  const left = Math.round((1024 - bW) / 2);
  const baseContactY = 746;
  const top = baseContactY - bH;

  const shadowW = bW + 60;
  const shadowH = 30;
  const shadowSvg = `
  <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4.0" />
      </filter>
      <filter id="f2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
    </defs>
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.44}" ry="8" fill="#1b1209" opacity="0.65" filter="url(#f1)" />
    <ellipse cx="${shadowW / 2}" cy="15" rx="${bW * 0.28}" ry="4" fill="#080503" opacity="0.9" filter="url(#f2)" />
  </svg>
  `;
  const shadowBuf = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  await sharp(masterBgPath)
    .composite([
      { input: shadowBuf, left: Math.round(left - 30), top: baseContactY - 14 },
      { input: resized.data, left: left, top: top }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(publicImagesDir, `ghalati_${slug}.jpg`));
}

async function processBundleImage(buf, slug) {
  // Save original
  fs.writeFileSync(path.join(publicImagesDir, `original_${slug}.png`), buf);

  // High quality studio presentation contained in 1024x1024
  const inner = await sharp(buf)
    .resize({ width: 940, height: 940, fit: 'contain', background: { r: 247, g: 245, b: 240, alpha: 1 } })
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 247, g: 245, b: 240, alpha: 1 }
    }
  })
  .composite([
    { input: inner, gravity: 'center' }
  ])
  .jpeg({ quality: 95 })
  .toFile(path.join(publicImagesDir, `ghalati_${slug}.jpg`));
}

async function main() {
  const perfumesPath = path.join(__dirname, '..', 'public', 'data', 'perfumes.json');
  const existingPerfumes = JSON.parse(fs.readFileSync(perfumesPath, 'utf8'));
  const existingIds = new Set(existingPerfumes.map(p => p.id));

  console.log(`Currently in store: ${existingPerfumes.length} products`);
  console.log(`Processing ${rawProducts.length} additional products...`);

  const newlyAdded = [];

  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const slug = p.id;

    if (existingIds.has(slug)) {
      console.log(`[${i+1}/${rawProducts.length}] Skipping ${slug} (already exists)`);
      continue;
    }

    console.log(`[${i+1}/${rawProducts.length}] Processing ${slug} (${p.title})...`);
    
    // Download image
    let imgBuf;
    try {
      imgBuf = await downloadBuffer(p.bottleUrl);
    } catch(err) {
      console.error(`Error downloading image for ${slug}:`, err.message);
      continue;
    }

    const isBundle = p.categoryType === 'bundle';

    try {
      if (isBundle) {
        await processBundleImage(imgBuf, slug);
      } else {
        await processSingleBottle(imgBuf, slug);
      }
    } catch (imgErr) {
      console.error(`Image processing error for ${slug}:`, imgErr.message);
      // Fallback to bundle presentation if single bottle BFS had issues
      await processBundleImage(imgBuf, slug);
    }

    const t = translations[slug] || {};

    const fullProduct = {
      id: slug,
      title: p.title,
      titleEn: t.titleEn || p.titleEn || slug,
      brand: 'دار غلاتي (Ghalati)',
      categoryType: p.categoryType || (isBundle ? 'bundle' : 'perfume'),
      sarPrice: p.sarPrice,
      baseJod: p.baseJod,
      finalJod: p.finalJod,
      url: p.url,
      bottleUrl: p.bottleUrl,
      overview: p.overview,
      opening: p.opening,
      heart: p.heart,
      base: p.base,
      prominent: p.prominent,
      specs: p.specs,
      image: `images/ghalati_${slug}.jpg`,
      originalImage: `images/original_${slug}.png`,
      galleryImages: p.galleryImages || [p.bottleUrl],
      overviewEn: t.overviewEn || p.overview,
      openingEn: t.openingEn || p.opening,
      heartEn: t.heartEn || p.heart,
      baseEn: t.baseEn || p.base,
      prominentEn: t.prominentEn || p.prominent,
      specsEn: {
        origin: 'Kingdom of Saudi Arabia',
        category: p.specs.category === 'نسائي' ? 'Women' : (p.specs.category === 'رجالي' ? 'Men' : 'Unisex'),
        size: p.specs.size,
        type: t.typeEn || p.specs.type
      }
    };

    existingPerfumes.push(fullProduct);
    existingIds.add(slug);
    newlyAdded.push(fullProduct);

    console.log(`  -> Added ${slug}: ${fullProduct.finalJod} JOD (${fullProduct.sarPrice} SAR)`);
  }

  fs.writeFileSync(perfumesPath, JSON.stringify(existingPerfumes, null, 2), 'utf8');
  console.log(`\nCOMPLETED! Total store products now: ${existingPerfumes.length} (Added ${newlyAdded.length} new items)`);
}

main();
