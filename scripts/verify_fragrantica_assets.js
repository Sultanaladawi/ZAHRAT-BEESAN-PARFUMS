const fs = require('fs');

const map = JSON.parse(fs.readFileSync('data/perfume_fragrantica_map.json', 'utf8'));

async function checkAll() {
  const verified = [];
  for (const item of map) {
    const fid = item.fid;
    const cardAr = `https://fimgs.net/mdimg/perfume-social-cards/ar-p_c_${fid}.jpeg`;
    const cardSoc = `https://fimgs.net/mdimg/perfume/social.${fid}.jpg`;
    const bottleO = `https://fimgs.net/mdimg/perfume/o.${fid}.jpg`;
    const bottle375 = `https://fimgs.net/mdimg/perfume/375x500.${fid}.jpg`;

    let cardUrl = null;
    let bottleUrl = null;

    try {
      const resCardAr = await fetch(cardAr, { method: 'HEAD' });
      if (resCardAr.ok) cardUrl = cardAr;
      else {
        const resCardSoc = await fetch(cardSoc, { method: 'HEAD' });
        if (resCardSoc.ok) cardUrl = cardSoc;
      }
    } catch (e) {}

    try {
      const resBottle = await fetch(bottleO, { method: 'HEAD' });
      if (resBottle.ok) bottleUrl = bottleO;
      else {
        const res375 = await fetch(bottle375, { method: 'HEAD' });
        if (res375.ok) bottleUrl = bottle375;
      }
    } catch (e) {}

    console.log(`[${item.id}] fid: ${fid} | Bottle: ${bottleUrl ? 'YES' : 'NO'} | Card: ${cardUrl ? 'YES' : 'NO'}`);
    verified.push({
      ...item,
      bottleUrl,
      cardUrl
    });
  }

  fs.writeFileSync('data/fragrantica_verified_assets.json', JSON.stringify(verified, null, 2), 'utf8');
}

checkAll();
