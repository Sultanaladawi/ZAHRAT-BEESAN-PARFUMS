const fs = require('fs');
const path = require('path');

const PUBLIC_PATH = path.join(__dirname, '..', 'public', 'data', 'assaf_perfumes.json');
const ARCHIVE_PATH = path.join(__dirname, '..', 'data', 'assaf_master_archive.json');

const assafPublic = JSON.parse(fs.readFileSync(PUBLIC_PATH, 'utf8'));
const assafArchive = JSON.parse(fs.readFileSync(ARCHIVE_PATH, 'utf8'));

function applyFixes(catalog) {
  // 1. Fix the 6 mini 25ml perfumes to be bundle category
  const miniIds = new Set([
    'assaf-150537914',
    'assaf-611082214',
    'assaf-304264724',
    'assaf-2061203365',
    'assaf-547643241',
    'assaf-1565660433'
  ]);

  // 2. Exact title corrections
  const titleFixes = {
    'assaf-71799739': 'عطر مس ساكورا 200 مل',
    'assaf-461410714': 'عطر مس ساكورا 100 مل',
    'assaf-566436803': 'عطر مس فلورا 200 مل',
    'assaf-810618592': 'عطر مس فلورا 100 مل',
    'assaf-726698752': 'عطر بينك ليدي 200 مل',
    'assaf-1034388136': 'عطر بينك ليدي 100 مل',
    'assaf-755661118': 'عطر وايلد كولت 200 مل',
    'assaf-598668494': 'عطر نوبل 200 مل'
  };

  catalog.forEach(item => {
    if (miniIds.has(item.id)) {
      item.categoryType = 'bundle';
      if (item.specs) {
        item.specs.type = 'عطر ميني 25 مل';
        item.specs.size = '25 مل';
      }
    }

    if (titleFixes[item.id]) {
      item.title = titleFixes[item.id];
    }
  });

  return catalog;
}

const fixedPublic = applyFixes(assafPublic);
const fixedArchive = applyFixes(assafArchive);

fs.writeFileSync(PUBLIC_PATH, JSON.stringify(fixedPublic, null, 2), 'utf8');
fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(fixedArchive, null, 2), 'utf8');

console.log('Successfully updated Assaf public catalog and master archive!');
