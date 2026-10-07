const fs = require('fs');

const scraped = JSON.parse(fs.readFileSync('data/live_scraped_ghalati.json', 'utf8'));
const perfumes = JSON.parse(fs.readFileSync('public/data/perfumes.json', 'utf8'));

// Fix rasayil-haneen
const haneenEntry = scraped.find(s => s.id === 'rasayil-haneen');
if (haneenEntry) {
  haneenEntry.success = true;
  haneenEntry.parsed = {
    overview: "رسائل حنين عطر منعش يتحدى الجاذبية فتراقصها نسمة هواء محملة بعبير الازهار و الياسمين لخلق أثر عطري رائع التي تذهب بحواسك بعيدا إلى عالم مليء بالجمال وفرحا منعشا للروح .",
    opening: "البرغموت",
    heart: "البرتقال",
    base: "الباتشولي و التفاح",
    prominent: "البرغموت و البرتقال",
    perfumer: "",
    origin: "المملكة العربية السعودية",
    category: "للجنسين",
    size: "100 مل",
    type: "عطر"
  };
}

// Special handling for the 3 Carthage perfumes
const cartageVelours = scraped.find(s => s.id === 'cartage-velours');
if (cartageVelours && cartageVelours.parsed) {
  cartageVelours.parsed.overview = "CARTHAGE VELOURS || الفخامة والاحتفال في زجاجة. في قلب الاحتفال، حيث تتناغم الأصوات كأوركسترا من الفرح، يحمل طاقة الاحتفال كلها مع التوت الأحمر والورد التركي والمسك الفاخر.";
  cartageVelours.parsed.opening = "كوكتيل شمبانيا فواحة، التوت الأحمر، الكرز الأسود، والخوخ";
  cartageVelours.parsed.heart = "الورد التركي، الفاوانيا، والبنفسج";
  cartageVelours.parsed.base = "خشب الكشمير الناعم والمسك الراقي";
  cartageVelours.parsed.prominent = "كوكتيل الشمبانيا، التوت الأحمر، الورد التركي، خشب الكشمير، والمسك";
  cartageVelours.parsed.perfumer = "BELMAS THEO (ثيو بيلماس)";
}

const cartageEtoile = scraped.find(s => s.id === 'cartage-etoile');
if (cartageEtoile && cartageEtoile.parsed) {
  cartageEtoile.parsed.overview = "CARTHAGE ETOILE || لمسة شاعرية تحت سماء النجوم. عطر صُمم ليعبر عن شعور يشبهك، يحمل نفحات من الفانيليا الحالمة والمارشملو الناعم مع عبير الورد والبخور الفاخر.";
  cartageEtoile.parsed.opening = "المارشملو الناعم ونفحات الفانيليا الحالمة";
  cartageEtoile.parsed.heart = "عبير الورد الراقي والبخور";
  cartageEtoile.parsed.base = "الأخشاب الأنيقة، العنبر، والفانيليا";
  cartageEtoile.parsed.prominent = "المارشملو، البخور، الورد، العنبر، الفانيليا";
  cartageEtoile.parsed.perfumer = "Gael Montero (جايل مونتيرو)";
}

const cartageNoble = scraped.find(s => s.id === 'cartage-noble');
if (cartageNoble && cartageNoble.parsed) {
  cartageNoble.parsed.overview = "CARTHAGE NOBLE || عبق الفخامة والكلاسيكية. بين أضواء الشفق وظلال أشجار الياسمين، يحمل بين طياته عبقاً يعبر عن حضور مهيب وشخصية فريدة مع الورد القرطاجي والزعفران الإسباني.";
  cartageNoble.parsed.opening = "الزعفران الإسباني والبندق";
  cartageNoble.parsed.heart = "الورد القرطاجي، أشجار الياسمين واللبان البخوري";
  cartageNoble.parsed.base = "الفانيليا، العنبر والأخشاب";
  cartageNoble.parsed.prominent = "البندق، الروز، الزعفران، الفانيليا، اللبان البخوري";
  cartageNoble.parsed.perfumer = "فريق البحث والتطوير بغلاتي";
}

const perfumeList = perfumes.filter(p => p.categoryType === 'perfume');
console.log(`Auditing all ${perfumeList.length} perfumes:\n`);

perfumeList.forEach((p, idx) => {
  const s = scraped.find(x => x.id === p.id);
  const data = s?.parsed;
  console.log(`[${idx + 1}/${perfumeList.length}] ID: ${p.id} | Name: ${p.title}`);
  console.log(`  Overview: ${data?.overview ? data.overview.slice(0, 80) + '...' : 'NONE'}`);
  console.log(`  Opening: ${data?.opening || 'NONE'}`);
  console.log(`  Heart: ${data?.heart || 'NONE'}`);
  console.log(`  Base: ${data?.base || 'NONE'}`);
  console.log(`  Prominent: ${data?.prominent || 'NONE'}`);
  console.log(`  Perfumer: ${data?.perfumer || 'N/A'}`);
  console.log('--------------------------------------------------');
});
