// ══════════════════════════════════════════════════════════
// 🧭 "Find your perfume": four quick questions, then the best matches
// from every house, scored on gender, product type, scent family and budget.
// ══════════════════════════════════════════════════════════

const QUIZ = [
  { key: 'for', ar: 'لمين العطر؟', en: 'Who is it for?', options: [
    ['m', 'رجالي', 'Him'], ['w', 'نسائي', 'Her'], ['u', 'للجنسين', 'Anyone'] ] },
  { key: 'type', ar: 'شو بتدوّر عليه؟', en: 'What are you looking for?', options: [
    ['perfume', 'عطر', 'Perfume'], ['oil', 'دهن عود أو تولة', 'Oud oil / perfume oil'], ['gift', 'هدية أو مجموعة', 'Gift set'] ] },
  { key: 'scent', ar: 'أي ريحة بتحب؟', en: 'Which scent do you love?', options: [
    ['oud', 'عود وخشب', 'Oud & woods'], ['floral', 'ورد وزهور', 'Roses & flowers'], ['fresh', 'فريش وحمضيات', 'Fresh & citrus'],
    ['sweet', 'حلو وفانيلا', 'Sweet & vanilla'], ['musk', 'مسك', 'Musk'] ] },
  { key: 'budget', ar: 'ميزانيتك؟', en: 'Your budget?', options: [
    ['low', 'أقل من 25 د.أ', 'Under 25 JOD'], ['mid', '25 – 40 د.أ', '25 – 40 JOD'], ['high', 'أكثر من 40 د.أ', 'Over 40 JOD'] ] },
];

const QUIZ_SCENTS = {
  oud: /عود|خشب|صندل|عنبر|بخور|oud|wood|sandal|amber|agar/i,
  floral: /ورد|زهر|ياسمين|فل|سوسن|rose|flor|jasmin|iris|peony/i,
  fresh: /حمض|ليمون|برغموت|بحر|نعناع|فريش|citrus|lemon|bergamot|fresh|marine|aqua|mint/i,
  sweet: /فانيلا|حلو|كراميل|شوكو|سكر|توت|vanilla|sweet|caramel|choco|candy|berry|praline/i,
  musk: /مسك|musk/i,
};

let quizAnswers = {};
let quizStep = 0;

function quizText(q) { return currentLang === 'ar' ? q.ar : q.en; }

function openQuiz() {
  quizAnswers = {};
  quizStep = 0;
  renderQuiz();
  document.getElementById('quizModal').style.display = 'flex';
}

function closeQuiz() {
  const m = document.getElementById('quizModal');
  if (m) m.style.display = 'none';
}

function quizPick(value) {
  quizAnswers[QUIZ[quizStep].key] = value;
  quizStep += 1;
  renderQuiz();
}

function quizGender(p) {
  const s = `${p.specs?.category || ''} ${p.title} ${p.titleEn || ''}`;
  return /للجنسين|unisex/i.test(s) ? 'u' : /نسائ|women|femme|for her|لها/i.test(s) ? 'w' : /رجال|men\b|homme|for him|له\b/i.test(s) ? 'm' : 'u';
}

function quizResults() {
  const a = quizAnswers;
  const range = { low: [0, 25], mid: [25, 40], high: [40, 1e9] }[a.budget] || [0, 1e9];
  return allLoadedProducts().filter(p => p.isAvailable !== false && p.status !== 'out').map(p => {
    const notes = `${p.title} ${p.titleEn || ''} ${p.opening || ''} ${p.heart || ''} ${p.base || ''} ${p.prominent || ''} ${p.overview || ''}`;
    const type = a.type === 'gift' ? ['bundle', 'gift_set'].includes(p.categoryType) : a.type === 'oil' ? p.categoryType === 'oil' : p.categoryType === 'perfume' || !p.categoryType;
    if (!type) return null;
    const price = Number(p.finalJod) || 0;
    const g = quizGender(p);
    let score = 0;
    if (g === a.for) score += 3; else if (g === 'u' || a.for === 'u') score += 1; else return null;
    if (QUIZ_SCENTS[a.scent] && QUIZ_SCENTS[a.scent].test(notes)) score += 4;
    if (price >= range[0] && price < range[1]) score += 3; else if (Math.abs(price - (range[0] + Math.min(range[1], 60)) / 2) < 12) score += 1;
    if (p.imageLayout === 'showcase') score += 0.5;
    return { p, score };
  }).filter(Boolean).sort((x, y) => y.score - x.score).slice(0, 8).map(o => o.p);
}

function renderQuiz() {
  const box = document.getElementById('quizBody');
  if (!box) return;
  const isAr = currentLang === 'ar';
  if (quizStep < QUIZ.length) {
    const q = QUIZ[quizStep];
    box.innerHTML = `
      <div class="quiz-progress">${QUIZ.map((_, i) => `<span class="${i <= quizStep ? 'is-on' : ''}"></span>`).join('')}</div>
      <h3 class="quiz-question">${quizText(q)}</h3>
      <div class="quiz-options">${q.options.map(([v, ar, en]) => `<button type="button" onclick="quizPick('${v}')">${isAr ? ar : en}</button>`).join('')}</div>
      ${quizStep ? `<button type="button" class="quiz-back" onclick="quizStep--; renderQuiz()">${isAr ? '→ رجوع' : '← Back'}</button>` : ''}`;
    return;
  }
  const items = quizResults();
  const t = translations[currentLang] || translations.ar;
  box.innerHTML = `
    <h3 class="quiz-question">${isAr ? 'عطور مختارة لك ✨' : 'Picked for you ✨'}</h3>
    ${items.length ? `<div class="quiz-results">${items.map(p => renderProductCard(p, t)).join('')}</div>`
      : `<p class="suggest-empty">${isAr ? 'ما لقينا تطابق كامل، جرّب خيارات ثانية.' : 'No close match, try other answers.'}</p>`}
    <button type="button" class="quiz-back" onclick="openQuiz()">${isAr ? 'أعد الاختيار' : 'Start again'}</button>`;
}

// Opening a perfume from the results closes the quiz first.
document.addEventListener('DOMContentLoaded', () => {
  const original = window.openProductModal;
  if (typeof original === 'function') {
    window.openProductModal = function (...args) { closeQuiz(); return original.apply(this, args); };
  }
});
