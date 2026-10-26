// ══════════════════════════════════════════════════════════
// 🌸 Perfume notes: turns the free-text opening / heart / base / prominent
// fields into a clean list of real ingredients (Arabic + English name and
// photo key). Supplier texts mix real notes with marketing filler
// ("قلب عطري متناغم", "قاعدة دافئة"…); only recognised notes, or short
// note-like words, are kept. Used by the perfume card (card.js) and by
// tools/note-photos.js. Works in the browser and in Node.
// ══════════════════════════════════════════════════════════
(function (root) {
  // key: [Arabic name, English name, aliases (Arabic, matched after normalising)]
  const NOTES = {
    'musk': ['المسك', 'Musk', ['مسك', 'مسك الروم', 'مسك ملكي', 'مسك ناعم', 'مسك ابيض ناعم', 'المسك الملكي']],
    'white-musk': ['المسك الأبيض', 'White Musk', ['مسك ابيض', 'مسك نظيف', 'ودز مسك']],
    'tuberose': ['مسك الليل', 'Tuberose', ['مسك الليل', 'توبيروز', 'تيوبروز', 'السنبل الهندي', 'توبي روز']],
    'sandalwood': ['خشب الصندل', 'Sandalwood', ['صندل', 'خشب صندل', 'خشب الصندل', 'صندل هندي', 'صندل ميسوري']],
    'bergamot': ['البرغموت', 'Bergamot', ['برغموت', 'بارغموت', 'برغموت ايطالي', 'برغموت كالابريا', 'زهره برغموت']],
    'saffron': ['الزعفران', 'Saffron', ['زعفران']],
    'amber': ['العنبر', 'Amber', ['عنبر', 'امبرغريس', 'كهرمان', 'عنبري', 'عنبر فاخر', 'عنبر دافي', 'عنبر جاف', 'خشب عنبر', 'عنبر ابيض', 'عنبر رمادي', 'امبرجريس']],
    'ambroxan': ['الأمبروكسان', 'Ambroxan', ['امبروكسان', 'امبروكس', 'امبريت', 'امبروكسون']],
    'jasmine': ['الياسمين', 'Jasmine', ['ياسمين', 'ياسيمن', 'زهره ياسمين', 'ياسمين هندي', 'ياسمين مصري', 'ياسمين ابيض']],
    'jasmine-sambac': ['ياسمين سامباك', 'Jasmine Sambac', ['ياسمين سامباك', 'سامباك', 'فل']],
    'oud': ['العود', 'Oud', ['عود', 'عود فاخر', 'خشب عود', 'دهن عود', 'عود هندي', 'عود كمبودي', 'عود معتق', 'عود ملكي', 'اجاروود', 'دهن عود معتق']],
    'damask-rose': ['الورد الدمشقي', 'Damask Rose', ['ورد دمشقي', 'ورود دمشقيه', 'وردة دمشقيه', 'ورد طائفي', 'ورد بلغاري']],
    'rose': ['الورد', 'Rose', ['ورد', 'ورود', 'وردة', 'ورد تركي', 'ورد احمر', 'زهره ورد', 'ورد ابيض']],
    'frankincense': ['اللبان', 'Frankincense', ['لبان', 'لبان عماني', 'لبان ذكر']],
    'incense': ['البخور', 'Incense', ['بخور']],
    'patchouli': ['الباتشولي', 'Patchouli', ['باتشولي', 'بتشولي', 'باتشولي هندي']],
    'pink-pepper': ['الفلفل الوردي', 'Pink Pepper', ['فلفل وردي', 'فلفل زهري']],
    'black-pepper': ['الفلفل الأسود', 'Black Pepper', ['فلفل', 'فلفل اسود']],
    'vanilla': ['الفانيليا', 'Vanilla', ['فانيليا', 'فانيلا', 'فانيليا مدغشقر', 'فانيليا ناعمه', 'فانيليا بوربون']],
    'cedar': ['خشب الأرز', 'Cedarwood', ['ارز', 'خشب ارز', 'اخشاب ارز', 'ارز اطلسي', 'ارز فرجيني']],
    'woods': ['الأخشاب', 'Woods', ['اخشاب', 'اخشاب عطريه', 'خشب', 'اخشاب جافه', 'اخشاب ثمينه', 'خشبي', 'اخشاب دافئه', 'اخشاب بيضاء']],
    'orange-blossom': ['زهر البرتقال', 'Orange Blossom', ['زهر برتقال', 'زهره برتقال', 'ازهار برتقال', 'زهر نارنج', 'زهر البرتقال']],
    'neroli': ['النيرولي', 'Neroli', ['نيرولي']],
    'flowers': ['الأزهار', 'Flowers', ['زهور', 'ازهار', 'زهري', 'باقه زهور']],
    'white-flowers': ['الزهور البيضاء', 'White Flowers', ['زهور بيضاء', 'ازهار بيضاء', 'زهره بيضاء']],
    'lemon': ['الليمون', 'Lemon', ['ليمون', 'ليمون سفوما', 'ليمون صقلي', 'ليمون اخضر']],
    'vetiver': ['نجيل الهند', 'Vetiver', ['نجيل هند', 'فيتيفر', 'نجيل', 'فيتفير']],
    'orange': ['البرتقال', 'Orange', ['برتقال', 'زيت برتقال', 'برتقال مر', 'نارنج']],
    'lily-of-the-valley': ['زنبق الوادي', 'Lily of the Valley', ['زنبق وادي', 'زهره وادي', 'موجيت', 'موغيه', 'موغيت', 'ماغيت', 'زنابق وادي']],
    'lily': ['الزنبق', 'Lily', ['زنبق', 'زنبق ابيض']],
    'peach': ['الخوخ', 'Peach', ['خوخ', 'دراق']],
    'nectarine': ['النكتارين', 'Nectarine', ['نكتارين']],
    'apricot': ['المشمش', 'Apricot', ['مشمش']],
    'cardamom': ['الهيل', 'Cardamom', ['هيل', 'حبهان', 'هال']],
    'mandarin': ['اليوسفي', 'Mandarin', ['يوسفي', 'مندرين', 'ماندرين', 'ماندارين', 'ماندرينا', 'يوسفي اخضر', 'مندرين اخضر']],
    'grapefruit': ['الجريب فروت', 'Grapefruit', ['جريب فروت', 'غريب فروت', 'جريبفروت', 'جريب فروت وردي']],
    'blackcurrant': ['الكشمش الأسود', 'Blackcurrant', ['كشمش اسود', 'كشمش', 'زهر كشمش']],
    'tonka': ['حبوب التونكا', 'Tonka Bean', ['حبوب تونكا', 'تونكا', 'فول تونكا', 'حبه تونكا']],
    'lavender': ['اللافندر', 'Lavender', ['لافندر', 'خزامى', 'خزامي', 'لافاندين', 'لافاندر']],
    'apple': ['التفاح', 'Apple', ['تفاح', 'تفاح اخضر', 'تفاح احمر']],
    'violet': ['البنفسج', 'Violet', ['بنفسج', 'زهره بنفسج', 'فيوليت']],
    'violet-leaf': ['أوراق البنفسج', 'Violet Leaf', ['اوراق بنفسج', 'ورق بنفسج']],
    'iris': ['السوسن', 'Iris', ['سوسن', 'زبده سوسن', 'جذور سوسن', 'زهره سوسن', 'ايريس', 'اوريس']],
    'pear': ['الكمثرى', 'Pear', ['كمثرى', 'كمثري', 'اجاص', 'انجاص']],
    'pineapple': ['الأناناس', 'Pineapple', ['اناناس']],
    'ginger': ['الزنجبيل', 'Ginger', ['زنجبيل']],
    'leather': ['الجلد', 'Leather', ['جلد', 'جلود', 'ليذر', 'شامواه', 'سويدي']],
    'raspberry': ['توت العليق', 'Raspberry', ['توت عليق', 'فرامبوا', 'توت احمر', 'رازبيري']],
    'berries': ['التوت', 'Berries', ['توت', 'توت بري', 'فواكه حمراء', 'توتيات']],
    'blackberry': ['التوت الأسود', 'Blackberry', ['توت اسود']],
    'strawberry': ['الفراولة', 'Strawberry', ['فراوله', 'فراولة']],
    'cherry': ['الكرز', 'Cherry', ['كرز']],
    'plum': ['البرقوق', 'Plum', ['برقوق']],
    'fig': ['التين', 'Fig', ['تين']],
    'pomegranate': ['الرمان', 'Pomegranate', ['رمان']],
    'coconut': ['جوز الهند', 'Coconut', ['جوز هند']],
    'watermelon': ['البطيخ', 'Watermelon', ['بطيخ']],
    'melon': ['الشمام', 'Melon', ['شمام']],
    'mango': ['المانجو', 'Mango', ['مانجو', 'مانجا']],
    'lychee': ['الليتشي', 'Lychee', ['ليتشي']],
    'passion-fruit': ['الباشن فروت', 'Passion Fruit', ['باشن فروت', 'فاكهه باشن', 'فاكهه العاطفه']],
    'banana': ['الموز', 'Banana', ['موز']],
    'geranium': ['إبرة الراعي', 'Geranium', ['ابره راعي', 'جيرانيوم', 'غرنوقي', 'جرمانيوم', 'برة الراعي']],
    'cinnamon': ['القرفة', 'Cinnamon', ['قرفه']],
    'caramel': ['الكراميل', 'Caramel', ['كراميل', 'كاراميل', 'توفي']],
    'praline': ['البرالين', 'Praline', ['برالين']],
    'honey': ['العسل', 'Honey', ['عسل']],
    'chocolate': ['الشوكولاتة', 'Chocolate', ['شوكولاته', 'شوكولا', 'كاكاو']],
    'coffee': ['القهوة', 'Coffee', ['قهوه', 'بن']],
    'almond': ['اللوز', 'Almond', ['لوز']],
    'guaiac': ['خشب الغاياك', 'Guaiac Wood', ['خشب غاياك', 'غاياك', 'جاياك']],
    'nutmeg': ['جوزة الطيب', 'Nutmeg', ['جوزه طيب']],
    'clove': ['القرنفل', 'Clove', ['قرنفل']],
    'spices': ['التوابل', 'Spices', ['توابل', 'توابل عطريه', 'توابل دافئه', 'بهارات', 'بيمنتو']],
    'cumin': ['الكمون', 'Cumin', ['كمون']],
    'mint': ['النعناع', 'Mint', ['نعناع', 'نعناع بري']],
    'basil': ['الريحان', 'Basil', ['ريحان']],
    'sage': ['المريمية', 'Sage', ['مريميه', 'ميرميه', 'ميرامية', 'مريميه مخمليه', 'مرميه', 'حكيم كلاري', 'كلاري سيج']],
    'rosemary': ['إكليل الجبل', 'Rosemary', ['اكليل جبل', 'روزماري']],
    'thyme': ['الزعتر', 'Thyme', ['زعتر']],
    'wormwood': ['الشيح', 'Wormwood', ['شيح', 'افسنتين', 'ارتميسيا']],
    'eucalyptus': ['اليوكاليبتوس', 'Eucalyptus', ['يوكاليبتوس', 'كينا', 'اوكالبتوس']],
    'juniper': ['العرعر', 'Juniper', ['عرعر', 'توت عرعر']],
    'cypress': ['السرو', 'Cypress', ['سرو']],
    'pine': ['الصنوبر', 'Pine', ['صنوبر']],
    'benzoin': ['البنزوين', 'Benzoin', ['بنزوين', 'جاوي', 'لبان جاوي']],
    'labdanum': ['اللابدانوم', 'Labdanum', ['لابدانوم', 'لادن', 'لبانوم', 'لاذن']],
    'myrrh': ['المر', 'Myrrh', ['مر', 'مره', 'جاوشير', 'اوبوباناكس']],
    'galbanum': ['الجلبانوم', 'Galbanum', ['جلابانوم', 'جلبانوم', 'قنه', 'جالبانوم', 'غلبانوم']],
    'cypriol': ['السيبريول', 'Cypriol', ['سيبريول', 'نجيل جاوي']],
    'oakmoss': ['طحلب البلوط', 'Oakmoss', ['طحلب بلوط', 'طحلب سنديان', 'طحلب', 'طحالب']],
    'citrus': ['الحمضيات', 'Citrus', ['حمضيات', 'فواكه حمضيه']],
    'cashmere-wood': ['خشب الكشمير', 'Cashmere Wood', ['خشب كشمير', 'كشمير', 'كاشميران', 'كشميران', 'خشب كاشمير']],
    'tobacco': ['التبغ', 'Tobacco', ['تبغ', 'اوراق تبغ', 'تنباك', 'توباكو']],
    'peony': ['الفاوانيا', 'Peony', ['فاوانيا', 'بيوني']],
    'magnolia': ['الماغنوليا', 'Magnolia', ['ماغنوليا', 'مغنوليا', 'مانجوليا', 'مغنوليه', 'زهره مغنوليه']],
    'orchid': ['الأوركيد', 'Orchid', ['اوركيد', 'سحلبيه']],
    'freesia': ['الفريزيا', 'Freesia', ['فريزيا', 'فريسيا', 'زهره فريسيا']],
    'gardenia': ['الغاردينيا', 'Gardenia', ['غاردينيا', 'جاردينيا', 'غردينيا', 'زهره تياري', 'تياري']],
    'narcissus': ['النرجس', 'Narcissus', ['نرجس']],
    'heliotrope': ['الهليوتروب', 'Heliotrope', ['هليوتروب', 'هيليوتروب']],
    'mimosa': ['الميموزا', 'Mimosa', ['ميموزا']],
    'ylang-ylang': ['اليلانغ يلانغ', 'Ylang-Ylang', ['يلانغ يلانغ', 'ايلنغ', 'ايلنغ ايلنغ', 'ايلنغ يلانغ', 'يلانج يلانج', 'ايلانغ ايلانغ', 'يلانغ', 'يلانج', 'ايلانج']],
    'lotus': ['اللوتس', 'Lotus', ['لوتس']],
    'hibiscus': ['الكركديه', 'Hibiscus', ['كركديه']],
    'osmanthus': ['الأوسمانثوس', 'Osmanthus', ['اوسمانثوس']],
    'green-tea': ['الشاي الأخضر', 'Green Tea', ['شاي اخضر']],
    'tea': ['الشاي', 'Tea', ['شاي', 'شاي اسود', 'ماتيه']],
    'green-leaves': ['الأوراق الخضراء', 'Green Leaves', ['اوراق خضراء', 'نوتات خضراء', 'عشب']],
    'ivy': ['أوراق اللبلاب', 'Ivy', ['اوراق لبلاب', 'لبلاب']],
    'aldehydes': ['الألدهيدات', 'Aldehydes', ['الدهيدات', 'الدهيد']],
    'sea-notes': ['النوتات البحرية', 'Sea Notes', ['نوتات بحريه', 'ملح بحري', 'نسيم البحر', 'نوتات مائيه', 'ملح', 'مارين', 'اتفاق بحري']],
    'sidr': ['خشب السدر', 'Sidr Wood', ['خشب سدر', 'سدر']],
    'tamarind': ['التمر الهندي', 'Tamarind', ['تمر هندي']],
    'dates': ['التمر', 'Dates', ['تمر']],
    'cotton': ['القطن', 'Cotton', ['قطن', 'زهره قطن']],
    'powdery': ['النوتات البودرية', 'Powdery Notes', ['بودره', 'بودري', 'نوتات بودريه']],
    'sugar': ['السكر', 'Sugar', ['سكر', 'حلوى', 'غزل البنات', 'مارشميلو', 'سكاكر']],
    'milk': ['الحليب', 'Milk', ['حليب', 'كريمه']],
    'pistachio': ['الفستق', 'Pistachio', ['فستق']],
    'hazelnut': ['البندق', 'Hazelnut', ['بندق']],
    'rum': ['الرم', 'Rum', ['رم', 'روم']],
    'birch': ['البتولا', 'Birch', ['بتولا', 'قطران']],
    'papyrus': ['البردي', 'Papyrus', ['بردي']],
    'bamboo': ['الخيزران', 'Bamboo', ['خيزران', 'بامبو']],
    'carrot-seed': ['بذور الجزر', 'Carrot Seeds', ['بذور جزر']],
    'coriander': ['الكزبرة', 'Coriander', ['كزبره']],
    'anise': ['اليانسون', 'Anise', ['يانسون', 'ينسون', 'يانسون نجمي']],
    'rhubarb': ['الراوند', 'Rhubarb', ['راوند', 'روبارب']],
    'elemi': ['الإيليمي', 'Elemi', ['ايليمي', 'الالمي', 'اليمي']],
    'mastic': ['المستكة', 'Mastic', ['مستكه', 'مسكه']],
    'lime': ['الليمون الأخضر', 'Lime', ['لايم', 'ليم']],
    'kumquat': ['الكمكوات', 'Kumquat', ['كمكوات']],
    'quince': ['السفرجل', 'Quince', ['سفرجل']],
    'blueberry': ['التوت الأزرق', 'Blueberry', ['توت ازرق']],
    'red-fruits': ['الفواكه', 'Fruits', ['فواكه', 'فاكهي', 'فاكهه', 'نوتات فاكهيه']],
    'resins': ['الراتنجات', 'Resins', ['راتنجات', 'راتنج']],
    'chamomile': ['البابونج', 'Chamomile', ['بابونج']],
    'fir-balsam': ['بلسم التنوب', 'Fir Balsam', ['بلسم تنوب', 'تنوب']],
    'linden': ['زهر الزيزفون', 'Linden Blossom', ['زهر زيزفون', 'زيزفون']],
    'balsam': ['البلسم', 'Balsam', ['بلسم بيرو', 'بلسم تولو', 'بلسام بيرو', 'بلسم جورجون', 'بلسم']],
    'davana': ['الدافانا', 'Davana', ['دافانا']],
    'hedione': ['الهيديون', 'Hedione', ['هيديون']],
    'raisin': ['الزبيب', 'Raisin', ['زبيب', 'زبيب اسود']],
    'grape': ['العنب', 'Grape', ['عنب', 'عنب اسود']],
    'tomato-leaf': ['أوراق الطماطم', 'Tomato Leaf', ['اوراق طماطم']],
    'marigold': ['القطيفة', 'Marigold', ['قطيفه', 'زهره قطيفه']],
    'licorice': ['العرقسوس', 'Licorice', ['عرقسوس']],
    'frangipani': ['الفرنجيباني', 'Frangipani', ['فرنجيباني', 'بلوميريا']],
    'petitgrain': ['البيتيتغرين', 'Petitgrain', ['بيتيتغرين', 'بتيتغرين', 'بيتي غرين', 'بيتيغرين', 'زيت بيتيغرين']],
    'chestnut': ['الكستناء', 'Chestnut', ['كستناء']],
    'immortelle': ['زهرة الخلود', 'Immortelle', ['زهره خلود']],
    'styrax': ['الستيراكس', 'Styrax', ['ستايراكس', 'ستيراكس']],
    'sesame': ['السمسم', 'Sesame', ['سمسم']],
    'guava': ['الجوافة', 'Guava', ['جوافه']],
    'yuzu': ['اليوزو', 'Yuzu', ['يوزو']],
    'marine': ['النوتات المائية', 'Aquatic Notes', ['مائي', 'مائيه']],
  };

  // Filler words: a token carrying one of these (and not matching a note) is
  // marketing text, not an ingredient.
  const FILLER = /عطري|نفحات|نفحه|قاعده|قلب|مقدمه|افتتاح|نغمات|نغمه|فاخر|ثابت|ثبات|غني|مميز|منعش|دار|توقيع|مستخلص|مناسب|استخدام|تصنيف|فوحان|فواح|اناق|دافئ|دافي|عميق|مركز|نقي|مكونات|تولي|تولة|توله|خلاصه|زيت عطري|تجربه|اختيار|يدوم|لمسات|تعكس|تمنح|يجعل|الملكي|ملكيه|انوثه|ذكوري|رجولي|حضور|طويل|بلمسات|شرقي|شرقيه|خشبيه|زهريه|حمضيه|عليا|متناغم|اسر|متوازن|نادر|ساحر|جذاب|حديقه|صغيره|كبيره|عبهر/;

  // Lower-cases Latin, drops Arabic diacritics/tatweel, unifies alef/teh
  // marbuta/yeh, and removes a leading "ال" (and "و"/"ب"+"ال") from each word.
  function norm(s) {
    return String(s || '')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .split(/\s+/).map(w => w.replace(/^(?:وال|بال|لل|ال)(?=..)/, '').replace(/^ال(?=...)/, '')).join(' ')
      .replace(/[^؀-ۿa-z0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // alias (normalised) → key; longest aliases first for containment matches.
  const ALIAS = new Map();
  for (const [key, [ar, , aliases]] of Object.entries(NOTES)) {
    for (const a of [ar, ...aliases]) ALIAS.set(norm(a), key);
  }
  const ALIASES_BY_LENGTH = [...ALIAS.keys()].sort((a, b) => b.length - a.length);

  // One token → note key, or a short unknown note, or null for filler.
  // Supplier texts glue headings to notes: "زهر البرتقال المكونات الأساسية",
  // "الياسمين النوتة القاعدية للعطر", "خشب الأرز لمراجعة المنتج…".
  const JUNK = / *(?:مكونات (?:اساسيه|رئيسيه).*|ل?نوته (?:قاعديه|وسطى|عليا|علويه).*|قلب عطر.*|قاعده عطر.*|ما الذي يجعل.*|عن عبوه.*|لمراجعه منتج.*|تصنيف عطر.*|افتتاحيه.*|من (?:هايتي|فرجينيا|كالابريا|مدغشقر|هند|اندونيسيا) *)$/;

  function matchToken(raw) {
    let n = norm(raw).replace(JUNK, '').trim();
    if (!n || n.length < 2) return null;
    if (!ALIAS.has(n) && n.startsWith('و') && ALIAS.has(n.slice(1))) n = n.slice(1);
    if (ALIAS.has(n)) return { key: ALIAS.get(n) };
    const words = n.split(' ');
    // Short phrases may wrap a note in an adjective: "العنبر الفاخر", "فانيليا مدغشقر".
    if (words.length <= 3) {
      for (const a of ALIASES_BY_LENGTH) {
        if (a.length < 2) continue;
        const re = new RegExp(`(^| )${a.replace(/ /g, ' ')}( |$)`);
        if (re.test(n)) return { key: ALIAS.get(a) };
      }
    }
    // Anything else is either filler or too rare to show reliably.
    return null;
  }

  // Splits a field on punctuation and the conjunction "و", without breaking
  // words that start with و (ورد، وردي، ورق).
  function splitField(text) {
    const out = [];
    for (const piece of String(text || '').split(/[،,;؛\/:.\n|•\-–()]+/)) {
      const p = piece.trim();
      if (!p) continue;
      const parts = p.split(/\s+و(?=\S)/).map((part, i) => {
        if (i === 0) return part;
        const asIs = matchToken(part);
        const withWaw = matchToken('و' + part);
        return withWaw && !asIs ? 'و' + part : part;
      });
      // "ورد وبرغموت" → two notes; keep the piece whole only when splitting
      // breaks a single note ("خشب الورد" stays one).
      if (parts.length > 1 && parts.filter(x => matchToken(x)).length >= Math.min(2, parts.length)) out.push(...parts);
      else out.push(p);
    }
    return out;
  }

  function fieldNotes(text) {
    const seen = new Set();
    const notes = [];
    for (const tok of splitField(text)) {
      const m = matchToken(tok);
      if (!m) continue;
      const id = m.key || norm(m.ar);
      if (seen.has(id)) continue;
      seen.add(id);
      notes.push(m.key ? { key: m.key, ar: NOTES[m.key][0], en: NOTES[m.key][1] } : { key: null, ar: m.ar, en: m.ar });
    }
    return notes;
  }

  // { opening, heart, base, prominent } of note objects; empty when the
  // product has no real notes.
  function perfumeNotes(p) {
    const res = {
      opening: fieldNotes(p.opening),
      heart: fieldNotes(p.heart),
      base: fieldNotes(p.base),
      prominent: fieldNotes(p.prominent),
    };
    // Prominent notes default to the first notes of the pyramid.
    if (!res.prominent.length) {
      const seen = new Set();
      res.prominent = [...res.base, ...res.heart, ...res.opening].filter(n => {
        const id = n.key || n.ar;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }).slice(0, 4);
    }
    res.count = res.opening.length + res.heart.length + res.base.length;
    return res;
  }

  const api = { NOTES, norm, matchToken, splitField, fieldNotes, perfumeNotes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PerfumeNotes = api;
})(typeof window !== 'undefined' ? window : globalThis);
