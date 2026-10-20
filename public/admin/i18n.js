// ══════════════════════════════════════════════════════════
// 🌐 Dashboard in English: every text the dashboard writes is Arabic; in
// English mode the page is switched to left-to-right and texts are swapped
// from this dictionary as they appear. Customer-written text, product names
// and anything inside .no-tr stay as written.
// ══════════════════════════════════════════════════════════

const ADMIN_EN = {
  // Navigation and shell
  'الرئيسية': 'Home', 'الطلبات': 'Orders', 'التحليلات': 'Analytics', 'المنتجات': 'Products', 'العروض': 'Offers',
  'أكواد الخصم': 'Coupons', 'التقييمات': 'Reviews', 'صندوق الرسائل': 'Inbox', 'طلبات التنبيه': 'Restock requests',
  'الوظائف': 'Jobs', 'طلبات التوظيف': 'Job applications', 'المساعد الذكي': 'AI assistant', 'إعدادات الموقع': 'Site settings',
  'الفريق': 'Team', 'لوحة القائد': 'Leader view', 'فتح المتجر': 'Open store', 'تسجيل الخروج': 'Sign out',
  'زهرة بيسان': 'Zahrat Beesan', 'زهرة بيسان للعطور': 'Zahrat Beesan Parfums', 'لوحة تحكم المتجر': 'Store dashboard',
  'اسم المستخدم': 'Username', 'كلمة السر': 'Password', 'دخول': 'Sign in', 'دخول آمن · الجلسة تبقى 7 أيام على هذا الجهاز': 'Secure sign-in · stays signed in for 7 days on this device',
  'إيقاف التنبيه': 'Stop alarm', 'طلب جديد': 'New order', 'عرض': 'View', 'المالك': 'Owner', 'مسؤول': 'Manager', 'موظف': 'Employee',
  'الطلبات: تلقائي حسب الدوام · مفتوح': 'Orders: auto (working hours) · open', 'الطلبات: تلقائي حسب الدوام · مغلق': 'Orders: auto (working hours) · closed',
  'الطلبات: مفتوح يدوياً': 'Orders: open', 'الطلبات: مغلق يدوياً': 'Orders: closed',
  'تلقائي حسب الدوام': 'Auto (working hours)', 'مفتوح يدوياً': 'Open', 'مغلق يدوياً': 'Closed',
  'مشكلة بالحفظ': 'Saving problem', 'الحفظ مؤقت': 'Saving is temporary',
  // Dashboard
  'لوحة القيادة': 'Command center', 'نظرة سريعة على المتجر: الطلبات، المنتجات والعروض.': 'A quick look at the store: orders, products and offers.',
  'إيراد اليوم': "Today's revenue", 'طلبات اليوم': "Today's orders", 'عمّان': 'Amman', 'كل الطلبات': 'All orders',
  'قيمة الطلبات': 'Order value', 'بدون الملغية': 'excluding cancelled', 'المنتجات المتوفرة': 'Products in stock', 'نفدت الكمية': 'Out of stock',
  'رسائل جديدة': 'New messages', 'آخر 7 أيام': 'Last 7 days', 'قيمة الطلبات بالدينار': 'Order value in JOD', 'الدور': 'Houses',
  'متوفر': 'In stock', 'نفد': 'Out', 'الأكثر طلباً': 'Best sellers', 'آخر حركات الفريق': 'Latest team activity', 'آخر حركاتك': 'Your latest activity',
  'اليوم': 'Today', 'الأحد': 'Sun', 'الإثنين': 'Mon', 'الثلاثاء': 'Tue', 'الأربعاء': 'Wed', 'الخميس': 'Thu', 'الجمعة': 'Fri', 'السبت': 'Sat',
  'لسا ما في طلبات. أول ما يطلب زبون من الحقيبة رح يبين هون.': 'No orders yet. The first order from the bag will show here.',
  'النظام جاهز. كل تعديل أو طلب رح ينسجل هون.': 'All set. Every change and order will be logged here.', 'حركاتك رح تظهر هون.': 'Your activity will show here.',
  'زبون': 'Customer', 'النظام': 'System',
  // Orders
  'كل طلب يرسله زبون من الحقيبة عبر واتساب ينسجل هون برقمه.': 'Every order a customer sends from the bag via WhatsApp is logged here with its number.',
  'كل الحالات': 'All statuses', 'رقم الطلب': 'Order no.', 'التاريخ': 'Date', 'الزبون': 'Customer', 'المجموع': 'Total', 'الحالة': 'Status',
  'التفاصيل': 'Details', 'جديد': 'New', 'مؤكد': 'Confirmed', 'قيد التوصيل': 'Out for delivery', 'تم التسليم': 'Delivered', 'ملغي': 'Cancelled',
  'ما في طلبات بهاي الحالة.': 'No orders with this status.', 'تفاصيل الطلب': 'Order details', 'الهاتف': 'Phone', 'الاستلام': 'Fulfilment',
  'من المتجر': 'Store pick-up', 'توصيل': 'Delivery', 'العنوان': 'Address', '📍 الخريطة': '📍 Map', 'ملاحظات الزبون': 'Customer notes',
  'كود الخصم': 'Coupon', 'التوصيل': 'Delivery', 'مجاني 🎉': 'Free 🎉', 'حسب المدينة': 'By city', 'عملة الزبون': 'Customer currency',
  'المنتج': 'Product', 'الكمية': 'Qty', 'السعر': 'Price', 'قبل الخصم': 'Before discount', 'الخصم': 'Discount', 'سجل الطلب': 'Order history',
  'الزبون أرسل الطلب': 'Customer sent the order', 'أرسل الطلب': 'sent the order', 'كتب ملاحظة': 'wrote a note',
  'اسم الزبون / ملاحظة': 'Customer name / note', 'حفظ الملاحظة': 'Save note', 'حذف الطلب': 'Delete order', 'واتساب': 'WhatsApp',
  // Analytics
  'تحليلات المبيعات': 'Sales analytics', 'المبيعات حسب الشهر أو فترة تختارها أو من البداية، مع أكثر المنتجات والدور مبيعاً.': 'Sales by month, a date range or all time, with the best-selling products and houses.',
  'عرض حسب:': 'View by:', 'شهري': 'Monthly', 'فترة': 'Date range', 'من البداية': 'All time', 'من': 'From', 'إلى': 'To',
  'الإيراد': 'Revenue', 'متوسط الطلب': 'Average order', 'لكل طلب': 'per order', 'القطع المباعة': 'Items sold', 'الأكثر مبيعاً': 'Best seller',
  'المبيعات اليومية': 'Daily sales', 'كل الفترات': 'All time', 'حصة كل دار من المبيعات': 'Sales share by house', 'دور': 'houses',
  'كل المنتجات المباعة': 'All products sold', '🥇 المركز الأول': '🥇 1st place', '🥈 المركز الثاني': '🥈 2nd place', '🥉 المركز الثالث': '🥉 3rd place',
  'ما في مبيعات بهاي الفترة.': 'No sales in this period.', 'لسا ما في مبيعات.': 'No sales yet.', 'ما في بيانات.': 'No data.', 'ابحث…': 'Search…',
  'كانون الثاني': 'January', 'شباط': 'February', 'آذار': 'March', 'نيسان': 'April', 'أيار': 'May', 'حزيران': 'June', 'تموز': 'July',
  'آب': 'August', 'أيلول': 'September', 'تشرين الأول': 'October', 'تشرين الثاني': 'November', 'كانون الأول': 'December',
  // Products and offers
  'أخفِ أي منتج، غيّر سعره، أو ميّزه بنجمة ليطلع في "مختارات زهرة بيسان" على الصفحة الرئيسية.': 'Hide any product, change its price, or star it to show it in "Zahrat Beesan picks" on the home page.',
  'ابحث بالاسم العربي أو الإنجليزي…': 'Search by Arabic or English name…', 'كل الدور': 'All houses', 'الكل': 'All', 'المتوفر': 'In stock',
  'المخفي': 'Hidden', 'المميز ⭐': 'Featured ⭐', 'سعر معدّل': 'Price changed', 'الدار': 'House', 'السعر (د.أ)': 'Price (JOD)',
  'ظاهر': 'Visible', 'مميز': 'Featured', 'السابق': 'Previous', 'التالي': 'Next', 'ما في منتجات مطابقة.': 'No matching products.',
  'عروض الموردين اللي بتنطبق تلقائياً بالحقيبة. السعر = سعر المورد + 4 د.أ لكل قنينة + ربحك.': "Supplier offers applied automatically in the bag. Price = supplier price + 4 JOD per bottle + your profit.",
  'الأرخص بينهم هدية': 'the cheapest is free', 'سعر ثابت للمجموعة من المورد': 'fixed group price from the supplier', 'ربحك على كل مجموعة:': 'Your profit per group:',
  // Coupons
  'الكود بينكتب بالحقيبة ويتأكد منه السيرفر، وما بيبين بكود الموقع لأي حدا.': 'Customers type the code in the bag and the server checks it; it never appears in the site code.',
  '✨ كود جديد': '✨ New code', 'الكود': 'Code', 'الخصم ٪': 'Discount %', 'حد أدنى (د.أ)': 'Minimum (JOD)', 'عدد الاستخدامات': 'Uses allowed',
  'ينتهي بتاريخ': 'Expires on', 'إضافة': 'Add', 'عدد الاستخدامات 0 = بلا حد. اضغط على أي اقتراح لتعبئته.': '0 uses = unlimited. Tap a suggestion to fill it in.',
  'الحد الأدنى': 'Minimum', 'الاستخدام': 'Usage', 'الصلاحية': 'Validity', 'فعّال': 'Active', 'مفتوح': 'Open', 'مرة': 'times',
  'لسا ما في أكواد. اختار اقتراح من فوق أو اكتب كودك.': 'No codes yet. Pick a suggestion above or type your own.',
  // Reviews
  'كل تقييم يكتبه زبون بيوصل هون أول، وما بيظهر على الموقع إلا لما تنشره.': 'Every customer review arrives here first and only shows on the site once you publish it.',
  '＋ إضافة تقييم من واتساب': '＋ Add a review from WhatsApp', 'بانتظار المراجعة': 'Awaiting review', 'منشور': 'Published', 'مخفي': 'Hidden',
  '✓ نشر': '✓ Publish', 'إخفاء': 'Hide', '★ بالرئيسية': '★ On home page', '☆ اعرضه بالرئيسية': '☆ Show on home page', '💬 رد': '💬 Reply',
  'ما في تقييمات جديدة بانتظارك.': 'No new reviews waiting.', 'ما في تقييمات هون.': 'No reviews here.', 'من واتساب': 'from WhatsApp',
  'إضافة تقييم': 'Add a review', 'كلام الزبون كما وصلك': "The customer's words as you got them", 'حفظ ونشر': 'Save and publish',
  // Inbox
  'رسائل "تواصل معنا" و"رأيك يهمنا" من الموقع. ردّ على الزبون على واتساب بكبسة.': '"Contact us" and "Your feedback" messages from the site. Reply on WhatsApp in one tap.',
  'غير مقروءة': 'Unread', 'جديدة': 'New', 'استفسار': 'Question', 'شكوى': 'Complaint', 'اقتراح': 'Suggestion', 'رأي بالمتجر': 'Store feedback',
  '💬 رد على واتساب': '💬 Reply on WhatsApp', 'تعليم كغير مقروءة': 'Mark unread', 'تعليم كمقروءة': 'Mark read', '✓ تم الرد': '✓ Replied',
  'الصندوق فاضي، كل الرسائل مقروءة.': 'Inbox is empty; everything is read.', 'رسالة': 'Message', 'الرسائل': 'Messages',
  // Notify-me
  'المنتجات اللي الزباين طلبوا يتبلغوا لما ترجع. الزبون بيبعتلك كمان على واتساب.': 'Products customers asked to be told about when they are back. They also message you on WhatsApp.',
  'عدد الطلبات': 'Requests', 'الآن': 'Now', 'آخر طلب': 'Last request', 'بانتظار': 'waiting', 'تم': 'Done', 'رجع متوفر ✅': 'Back in stock ✅',
  'لسا نافد': 'Still out', 'تم التبليغ': 'Customers told', 'ما في طلبات تنبيه لهلأ.': 'No restock requests yet.',
  // Jobs and applications
  'الوظائف المنشورة بتظهر بالموقع تحت "انضم لفريقنا"، وطلبات التقديم بتوصل لصفحة طلبات التوظيف.': 'Published jobs show on the site under "Join our team"; applications arrive in Job applications.',
  '＋ وظيفة جديدة': '＋ New job', '✏️ تعديل': '✏️ Edit', 'الطلبات ': 'Applications', 'متقدم': 'applicants',
  'ما في وظائف منشورة. اضغط "وظيفة جديدة" لتبلّش التوظيف.': 'No jobs posted. Press "New job" to start hiring.',
  'وظيفة جديدة': 'New job', 'تعديل الوظيفة': 'Edit job', 'اسم الوظيفة': 'Job title', 'نوع الدوام': 'Job type', 'المكان': 'Location',
  'الوصف والمطلوب': 'Description and requirements', 'نشر الوظيفة': 'Publish job', 'حفظ': 'Save',
  'دوام كامل': 'Full-time', 'دوام جزئي': 'Part-time', 'عقد': 'Contract', 'عن بعد': 'Remote', 'تدريب': 'Internship',
  'كل اللي قدّموا من صفحة "انضم لفريقنا".': 'Everyone who applied from "Join our team".', 'قيد المراجعة': 'Reviewing', 'مقابلة': 'Interview',
  'مقبول': 'Accepted', 'مرفوض': 'Rejected', '💬 واتساب': '💬 WhatsApp', '📞 اتصال': '📞 Call', 'ما في طلبات توظيف لهلأ.': 'No applications yet.',
  // AI
  'اسأل عن مبيعاتك وطلباتك ومنتجاتك بالعربي أو الإنجليزي، كتابة أو بالصوت.': 'Ask about your sales, orders and products in Arabic or English, by text or voice.',
  'كيف المبيعات اليوم؟': "How are today's sales?", 'شو أكثر الدور مبيعاً؟': 'Which houses sell best?', 'في طلبات متأخرة؟': 'Any late orders?',
  'لخّصلي التقييمات المنخفضة': 'Summarize the low reviews', 'اكتب سؤالك…': 'Type your question…', 'إرسال': 'Send',
  '✉ آخر رسائل الزباين': '✉ Latest customer messages', 'ما في رسائل.': 'No messages.',
  // Team and leader
  'كل شخص بيدخل باسم مستخدم وكلمة سر خاصين فيه، وكل اللي بيعمله بينسجل باسمه بلوحة القائد.': 'Everyone signs in with their own username and password, and everything they do is logged under their name in the leader view.',
  '＋ إضافة شخص للفريق': '＋ Add a team member', 'الاسم': 'Name', 'الشخص': 'Person', 'آخر نشاط': 'Last active', 'الحركات': 'Actions',
  '♛ المالك (انت)': '♛ Owner (you)', '🔑 كلمة سر': '🔑 Password',
  'كل إشي، ومعه الفريق ولوحة القائد وسجل كل حركة.': 'Everything, plus the team, the leader view and the full activity log.',
  'الطلبات والمنتجات والأسعار والعروض وأكواد الخصم والتقييمات وإعدادات الموقع.': 'Orders, products, prices, offers, coupons, reviews and site settings.',
  'الطلبات (تأكيد وتوصيل وتسليم)، والتقييمات، وطلبات التنبيه بس.': 'Orders (confirm, ship, deliver), reviews and restock requests only.',
  'مين عمل شو ومتى: كل تأكيد طلب، تعديل سعر، كود خصم، تقييم، ودخول وخروج. بتتحدث لحالها كل 15 ثانية.': 'Who did what and when: every order confirmation, price change, coupon, review, sign-in and sign-out. Refreshes every 15 seconds.',
  'حركات اليوم': "Today's actions", 'تحتاج متابعة': 'Needs follow-up', 'كل الأشخاص': 'Everyone', 'الزباين': 'Customers', 'كل الأقسام': 'All sections',
  'ابحث بالسجل…': 'Search the log…', 'الوقت': 'Time', 'القسم': 'Section', 'ما في حركات': 'No activity',
  '⚠️ تحتاج متابعة': '⚠️ Needs follow-up', 'تقييم 3 نجوم أو أقل · شكاوى': '3 stars or less · complaints', 'ما في تقييمات منخفضة.': 'Nothing to follow up.',
  'المنتجات ': 'Products', 'التنبيهات': 'Restock', 'الإعدادات': 'Settings', 'الدخول والخروج': 'Sign-in/out', 'فتح صفحات': 'Page views', 'تصدير': 'Exports',
  // Settings
  'انت بتقرر شو يبين على الموقع وشو لا. كل تغيير بيطبق على الموقع خلال ثواني.': 'You decide what the site shows. Every change goes live within seconds.',
  'استقبال الطلبات': 'Taking orders', 'الدوام من': 'Hours from', 'التوصيل المجاني': 'Free delivery',
  'التوصيل مجاني للطلبات من هذا المبلغ وفوق. اكتب 0 لإخفاء شريط التوصيل المجاني.': 'Delivery is free from this amount up. Enter 0 to hide the free-delivery bar.',
  'خانة كود الخصم بالحقيبة': 'Coupon field in the bag', 'بتبين بس إذا في كود فعّال واحد على الأقل.': 'Only shows when at least one code is active.',
  'تقييمات الزبائن': 'Customer reviews', 'شريط إعلان أعلى الموقع': 'Announcement bar', 'حفظ الإعلان': 'Save announcement',
  'الدور الظاهرة بالموقع': 'Houses shown on the site', 'شيل الصح عن أي دار لتخفيها كاملة من القائمة والصفحة الرئيسية.': 'Untick a house to hide it from the menu and the home page.',
  '"شاهدتها مؤخراً"': '"Recently viewed"', 'شريط المنتجات اللي شافها الزبون آخر مرة.': 'The rail of products the customer viewed last.',
  'الأسئلة الأربعة اللي بتقترح عطور للزبون.': 'The four questions that suggest perfumes.',
  // Counters and the log
  'جديد بانتظار التأكيد': 'new, awaiting confirmation', 'اليوم:': 'Today:', 'حركة': 'actions', 'طلبات:': 'orders:', 'آخر نشاط:': 'Last active:',
  'فتح صفحة': 'Opened', 'صدّر': 'Exported', 'تسجيل دخول': 'Signed in', 'تسجيل خروج': 'Signed out', 'بقيمة': 'worth',
  'تحديث إعدادات الموقع': 'Updated site settings', 'رسالة جديدة': 'New message', 'طلب توظيف جديد من': 'New job application from',
  'سأل المساعد الذكي': 'Asked the AI assistant', 'كود خصم جديد': 'New coupon', 'تقييم جديد': 'New review', 'أضاف وظيفة': 'Added job',
  'ℹ️ وضع التجربة المحلي: البيانات محفوظة في data/admin-state.json على هذا الجهاز.': 'ℹ️ Local test mode: data is kept in data/admin-state.json on this machine.',
  'المساعد الذكي بحاجة لمفتاح ANTHROPIC_API_KEY بإعدادات Vercel.': 'The AI assistant needs an ANTHROPIC_API_KEY in the Vercel settings.',
  // Common
  'تم الحفظ ✅': 'Saved ✅', 'حصل خطأ': 'Something went wrong', 'حذف': 'Delete', 'تعديل': 'Edit', 'نعم': 'Yes', 'لا': 'No', 'ملاحظة': 'Note',
  'الهاتف ': 'Phone', 'المدينة': 'City', 'قطعة': 'items', 'د.أ': 'JOD', 'منتج': 'products', 'كود فعّال': 'active codes', 'طلب تنبيه': 'restock requests',
  'من أصل': 'of', 'مخفية': 'Hidden', 'منشورة': 'Published', 'موقوف': 'Paused', 'انتهى': 'Expired', 'بلا حد': 'Unlimited',
  'غلاتي': 'Ghalati', 'عساف': 'Assaf', 'ثنيان': 'Thnyan', 'الرصاصي': 'Rasasi', 'الرحاب': 'Al-Rehab', 'لو بانهور': 'Le Bonheur', 'لافيرن': 'Laverne', 'درعة': 'Deraah',
};

// Longer phrases first, so "طلبات التنبيه" wins over "طلبات".
const ADMIN_EN_KEYS = Object.keys(ADMIN_EN).filter(k => k.trim().length >= 4).sort((a, b) => b.length - a.length);
let adminLang = 'ar';
try { adminLang = localStorage.getItem('zb_admin_lang') === 'en' ? 'en' : 'ar'; } catch (e) { /* private mode */ }

function trEn(text) {
  const t = text.trim();
  if (!t || !/[؀-ۿ]/.test(t)) return text;
  if (ADMIN_EN[t]) return text.replace(t, ADMIN_EN[t]);
  let out = text;
  for (const k of ADMIN_EN_KEYS) if (out.includes(k)) out = out.split(k).join(ADMIN_EN[k]);
  return out;
}

function translateTree(root) {
  if (adminLang !== 'en' || !root) return;
  const skip = el => el && el.closest && el.closest('.no-tr, script, style, textarea');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    if (skip(n.parentElement)) continue;
    const v = trEn(n.nodeValue);
    if (v !== n.nodeValue) n.nodeValue = v;
  }
  const els = root.querySelectorAll ? root.querySelectorAll('[placeholder], [title], [aria-label]') : [];
  for (const el of [root, ...els]) {
    if (!el.getAttribute || skip(el)) continue;
    for (const a of ['placeholder', 'title', 'aria-label']) {
      const v = el.getAttribute(a);
      if (v && /[؀-ۿ]/.test(v)) el.setAttribute(a, trEn(v));
    }
  }
}

function applyAdminLang() {
  const en = adminLang === 'en';
  document.documentElement.lang = en ? 'en' : 'ar';
  document.documentElement.dir = en ? 'ltr' : 'rtl';
  document.querySelectorAll('[data-lang-toggle]').forEach(b => { b.textContent = en ? 'ع' : 'EN'; });
  translateTree(document.body);
}

// Translate whatever the dashboard renders next (pages, toasts, modals).
let translating = false;
new MutationObserver(muts => {
  if (adminLang !== 'en' || translating) return;
  translating = true;
  for (const m of muts) {
    if (m.type === 'characterData') translateTree(m.target.parentElement);
    m.addedNodes.forEach(n => translateTree(n.nodeType === 3 ? n.parentElement : n));
  }
  translating = false;
}).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

document.addEventListener('DOMContentLoaded', () => {
  applyAdminLang();
  document.querySelectorAll('[data-lang-toggle]').forEach(b => b.addEventListener('click', () => {
    adminLang = adminLang === 'en' ? 'ar' : 'en';
    try { localStorage.setItem('zb_admin_lang', adminLang); } catch (e) { /* private mode */ }
    location.reload();
  }));
});
