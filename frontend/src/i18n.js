// SHAKTI i18n — Hindi + English + 6 Rajasthani dialects (core UI strings).
// Dialects are closely related; variations below reflect common spoken forms.
// Voice STT uses hi-IN with assisted audio; full dialect STT lands after field validation.
export const LANGS = [
  { v: 'hi', n: 'हिंदी' },
  { v: 'mwr', n: 'मारवाड़ी' },
  { v: 'mew', n: 'मेवाड़ी' },
  { v: 'dhd', n: 'ढूंढाड़ी' },
  { v: 'hoj', n: 'हाड़ौती' },
  { v: 'skw', n: 'शेखावाटी' },
  { v: 'wgd', n: 'वागड़ी' },
  { v: 'en', n: 'English' },
];

const D = {
  hi: {
    tagline: 'काम • हुनर • सुरक्षित अवसर', home: 'होम', jobs: 'काम', hunar: 'हुनर', learn: 'सीखें', help: 'सहायता',
    child: 'बच्चे', shg: 'SHG', biz: 'व्यवसाय', safety: 'सुरक्षा', market: 'बाज़ार', employer: 'नियोक्ता',
    admin: 'प्रशासन', analytics: 'एनालिटिक्स', pitch: 'परिचय', about: 'जानकारी', feedback: 'सुझाव',
    hero_t: 'आज आप क्या करना चाहती हैं?', hero_s: 'पास का सत्यापित काम • घर से काम • मुफ्त सीख • आंगनवाड़ी • SHG साथ',
    search_ph: 'खोजें: सिलाई, पापड़, चोमू…', search: 'खोजें', find_work: 'काम ढूंढें', home_work: 'घर से काम',
    learn_free: 'कुछ सीखें', ask_voice: 'बोलकर पूछें', childcare: 'आंगनवाड़ी खोजें', show_hunar: 'हुनर दिखाएं',
    verified_only: 'सुरक्षित काम ही दिखाएं', apply: 'आवेदन करें', listen: 'सुनें', call: 'कॉल करें', view: 'देखें',
    submit: 'भेजें', login: 'लॉगिन', signup: 'खाता बनाएं', logout: 'लॉगआउट', back: 'वापस', save: 'सहेजें',
    report_btn: 'रिपोर्ट करें', strip: 'सत्यापित काम ही चुनें — कभी अग्रिम फीस / OTP न दें',
    near_you: 'आपके पास सत्यापित काम', spotlight: 'हुनर सितारे', journey: 'एक महिला की कहानी',
  },
  mwr: {
    tagline: 'काम • हुनर • सुरछित मोको', home: 'घर', jobs: 'काम', hunar: 'हुनर', learn: 'सीखो', help: 'सहायता',
    child: 'टाबर', shg: 'SHG', biz: 'धंधो', safety: 'सुरछा', market: 'बाजार', employer: 'रोजगारदाता',
    admin: 'परशासन', analytics: 'हिसाब', pitch: 'परिचय', about: 'जाणकारी', feedback: 'सुझाव',
    hero_t: 'आज थे कांई करणो चावो?', hero_s: 'नजदीक रो पक्को काम • घर सूं काम • मुप्त सीख • आंगनवाड़ी • SHG साथ',
    search_ph: 'ढूंढो: सिलाई, पापड़, चोमू…', search: 'ढूंढो', find_work: 'काम ढूंढो', home_work: 'घर सूं काम',
    learn_free: 'कईं सीखो', ask_voice: "बोल'र पूछो", childcare: 'आंगनवाड़ी ढूंढो', show_hunar: 'हुनर दिखावो',
    verified_only: 'पक्को काम ई दिखावो', apply: 'अरजी करो', listen: 'सुणो', call: 'फोन करो', view: 'देखो',
    submit: 'भेजो', login: 'लॉगिन', signup: 'खातो बणावो', logout: 'बाहर', back: 'पाछे', save: 'राखो',
    report_btn: 'रपट करो', strip: 'पक्को काम ई चुणो — कदेई फीस / OTP मत देजो',
    near_you: 'थांके नजदीक पक्को काम', spotlight: 'हुनर तारा', journey: 'एक बीनणी री काणी',
  },
  mew: {
    tagline: 'काम • हुनर • सुरछित मोको', home: 'घर', jobs: 'काम', hunar: 'हुनर', learn: 'सीखो', help: 'मदद',
    child: 'छोरा-छोरी', shg: 'SHG', biz: 'धंधो', safety: 'सुरछा', market: 'बाजार', employer: 'काम देवण वाळो',
    admin: 'परशासन', analytics: 'हिसाब', pitch: 'परिचय', about: 'जाणकारी', feedback: 'सुझाव',
    hero_t: 'आज तमे कांई करणो चावो?', hero_s: 'नजदीक रो पक्को काम • घर सूं काम • मुप्त सीख • आंगनवाड़ी',
    search_ph: 'ढूंढो: सिलाई, पापड़…', search: 'ढूंढो', find_work: 'काम ढूंढो', home_work: 'घर सूं काम',
    learn_free: 'सीखो मुप्त', ask_voice: "बोल'र पूछो", childcare: 'आंगनवाड़ी ढूंढो', show_hunar: 'हुनर बतावो',
    verified_only: 'पक्को काम ई दिखावो', apply: 'अरजी करो', listen: 'सुणो', call: 'फोन लगावो', view: 'देखो',
    submit: 'भेजो', login: 'लॉगिन', signup: 'खातो बणावो', logout: 'बाहर', back: 'पाछे', save: 'राखो',
    report_btn: 'रपट करो', strip: 'पक्को काम ई चुणो — फीस / OTP मत देजो',
    near_you: 'थांके नजदीक पक्को काम', spotlight: 'हुनर तारा', journey: 'एक बाई री काणी',
  },
  dhd: {
    tagline: 'काम • हुनर • सुरछित मोको', home: 'घर', jobs: 'काम', hunar: 'हुनर', learn: 'सीखो', help: 'मदद',
    child: 'टाबर', shg: 'SHG', biz: 'धंधो', safety: 'सुरछा', market: 'बाजार', employer: 'काम देवण वाळो',
    admin: 'परशासन', analytics: 'हिसाब', pitch: 'परिचय', about: 'जाणकारी', feedback: 'सुझाव',
    hero_t: 'आज थे कांई करणा चावो हो?', hero_s: 'नजदीक को पक्को काम • घर सूं काम • मुप्त सीख',
    search_ph: 'ढूंढो: सिलाई, पापड़…', search: 'ढूंढो', find_work: 'काम ढूंढो', home_work: 'घर सूं काम',
    learn_free: 'मुप्त सीखो', ask_voice: "बोल'र पूछो", childcare: 'आंगनवाड़ी ढूंढो', show_hunar: 'हुनर दिखावो',
    verified_only: 'पक्को काम ई दिखावो', apply: 'अरजी करो', listen: 'सुणो', call: 'फोन करो', view: 'देखो',
    submit: 'भेजो', login: 'लॉगिन', signup: 'खातो बणावो', logout: 'बाहर', back: 'पाछे', save: 'राखो',
    report_btn: 'रपट करो', strip: 'पक्को काम ई चुणो — फीस / OTP मत देजो',
    near_you: 'थांके नजदीक पक्को काम', spotlight: 'हुनर तारा', journey: 'एक लुगाई री काणी',
  },
  hoj: {
    tagline: 'काम • हुनर • सुरछित मोको', home: 'घर', jobs: 'काम', hunar: 'हुनर', learn: 'सीखो', help: 'मदद',
    child: 'छोरा', shg: 'SHG', biz: 'धंधो', safety: 'सुरछा', market: 'बाजार', employer: 'काम देवण वाळो',
    admin: 'परशासन', analytics: 'हिसाब', pitch: 'परिचय', about: 'जाणकारी', feedback: 'सुझाव',
    hero_t: 'आज थे कई करनो चावो?', hero_s: 'नजदीक को पक्को काम • घर सूं काम • मुप्त सीख',
    search_ph: 'ढूंढो: सिलाई, पापड़…', search: 'ढूंढो', find_work: 'काम ढूंढो', home_work: 'घर सूं काम',
    learn_free: 'मुप्त सीखो', ask_voice: "बोल'र पूछो", childcare: 'आंगनवाड़ी ढूंढो', show_hunar: 'हुनर बतावो',
    verified_only: 'पक्को काम ई दिखावो', apply: 'अरजी करो', listen: 'सुणो', call: 'फोन करो', view: 'देखो',
    submit: 'भेजो', login: 'लॉगिन', signup: 'खातो बणावो', logout: 'बाहर', back: 'पाछे', save: 'राखो',
    report_btn: 'रपट करो', strip: 'पक्को काम ई चुणो — फीस / OTP मत देजो',
    near_you: 'थांके नजदीक पक्को काम', spotlight: 'हुनर तारा', journey: 'एक बाई री बात',
  },
  skw: {
    tagline: 'काम • हुनर • सुरछित मोको', home: 'घर', jobs: 'काम', hunar: 'हुनर', learn: 'सीखो', help: 'मदद',
    child: 'टाबर', shg: 'SHG', biz: 'धंधो', safety: 'सुरछा', market: 'बाजार', employer: 'सेठ',
    admin: 'परशासन', analytics: 'हिसाब', pitch: 'परिचय', about: 'जाणकारी', feedback: 'सुझाव',
    hero_t: 'आज थे के करणो चावो?', hero_s: 'नजदीक को पक्को काम • घर सूं काम • मुप्त सीख',
    search_ph: 'ढूंढो: सिलाई, पापड़…', search: 'ढूंढो', find_work: 'काम ढूंढो', home_work: 'घर सूं काम',
    learn_free: 'मुप्त सीखो', ask_voice: "बोल'र पूछो", childcare: 'आंगनवाड़ी ढूंढो', show_hunar: 'हुनर दिखावो',
    verified_only: 'पक्को काम ई दिखावो', apply: 'अरजी करो', listen: 'सुणो', call: 'फोन करो', view: 'देखो',
    submit: 'भेजो', login: 'लॉगिन', signup: 'खातो बणावो', logout: 'बाहर', back: 'पाछे', save: 'राखो',
    report_btn: 'रपट करो', strip: 'पक्को काम ई चुणो — फीस / OTP मत देजो',
    near_you: 'थांके नजदीक पक्को काम', spotlight: 'हुनर तारा', journey: 'एक बीनणी री बात',
  },
  wgd: {
    tagline: 'काम • हुनर • सुरछित मोको', home: 'घर', jobs: 'काम', hunar: 'हुनर', learn: 'सीखो', help: 'मदद',
    child: 'छोरां', shg: 'SHG', biz: 'धंधो', safety: 'सुरछा', market: 'बाजार', employer: 'काम आळो',
    admin: 'परशासन', analytics: 'हिसाब', pitch: 'परिचय', about: 'जाणकारी', feedback: 'सुझाव',
    hero_t: 'आज तमे सूं करवु चावो?', hero_s: 'नजदीक नुं पक्कुं काम • घर थी काम • मुप्त सीख',
    search_ph: 'ढूंढो: सिलाई, पापड़…', search: 'ढूंढो', find_work: 'काम ढूंढो', home_work: 'घर थी काम',
    learn_free: 'मुप्त सीखो', ask_voice: 'बोलीन पूछो', childcare: 'आंगनवाड़ी ढूंढो', show_hunar: 'हुनर बतावो',
    verified_only: 'पक्कुं काम ज दिखावो', apply: 'अरजी करो', listen: 'सांभळो', call: 'फोन करो', view: 'देखो',
    submit: 'भेजो', login: 'लॉगिन', signup: 'खातुं बणावो', logout: 'बाहर', back: 'पाछे', save: 'राखो',
    report_btn: 'रपट करो', strip: 'पक्कुं काम ज चुणो — फीस / OTP ना आपजो',
    near_you: 'तमने नजदीक पक्कुं काम', spotlight: 'हुनर तारा', journey: 'एक बेन नी वात',
  },
  en: {
    tagline: 'Work • Skills • Safe Opportunity', home: 'Home', jobs: 'Jobs', hunar: 'Skills', learn: 'Learn', help: 'Help',
    child: 'Kids', shg: 'SHG', biz: 'Business', safety: 'Safety', market: 'Market', employer: 'Employer',
    admin: 'Admin', analytics: 'Analytics', pitch: 'Pitch', about: 'About', feedback: 'Feedback',
    hero_t: 'What would you like to do today?', hero_s: 'Verified nearby work • Home-based • Free learning • Childcare • SHG support',
    search_ph: 'Search: stitching, papad, Chomu…', search: 'Search', find_work: 'Find work', home_work: 'Home-based',
    learn_free: 'Learn free', ask_voice: 'Ask by voice', childcare: 'Find childcare', show_hunar: 'Showcase skill',
    verified_only: 'Show verified only', apply: 'Apply', listen: 'Listen', call: 'Call', view: 'View',
    submit: 'Submit', login: 'Login', signup: 'Sign up', logout: 'Logout', back: 'Back', save: 'Save',
    report_btn: 'Report', strip: 'Choose verified work only — never pay fees / OTP',
    near_you: 'Verified work near you', spotlight: 'Skill stars', journey: 'One woman’s journey',
  },
};

let lang = localStorage.getItem('shakti_lang') || 'hi';
if (!D[lang]) lang = 'hi';
export function getLang() { return lang; }
export function setLang(v) { if (D[v]) { lang = v; localStorage.setItem('shakti_lang', v); } }
export function t(k) { return (D[lang] && D[lang][k]) || D.hi[k] || D.en[k] || k; }
export function isHindiLike() { return lang !== 'en'; }
