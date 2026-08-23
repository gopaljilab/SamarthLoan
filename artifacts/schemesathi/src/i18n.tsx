import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Language = 'English' | 'हिन्दी' | 'ಕನ್ನಡ';

const phrases: Record<Language, Record<string, string>> = {
  English: {},
  'हिन्दी': {
    'A short conversation': 'एक छोटी बातचीत', 'Let’s find what fits your next move.': 'आपके अगले कदम के लिए सही विकल्प खोजें।',
    'Your shortlist': 'आपकी चुनी हुई योजनाएँ', 'A match you can understand.': 'ऐसा मिलान जिसे आप समझ सकें।',
    'Scheme library': 'योजना पुस्तकालय', 'Browse support, without the fine print fog.': 'सहायता योजनाएँ आसानी से देखें।',
    'Make repayment legible': 'भुगतान को आसान भाषा में समझें', 'A monthly number you can plan around.': 'ऐसी मासिक राशि जिसे आप योजना में शामिल कर सकें।',
    'Choose your route': 'अपना रास्ता चुनें', 'A nearby partner, with a reason.': 'कारण सहित नज़दीकी साझेदार।',
    'A clear next step': 'एक स्पष्ट अगला कदम', 'Start your application, without the overwhelm.': 'बिना परेशानी अपना आवेदन शुरू करें।',
    'Keep moving': 'आगे बढ़ते रहें', 'Track your application, one step at a time.': 'अपने आवेदन को एक-एक कदम ट्रैक करें।',
    'Your Sathi dashboard': 'आपका साथी डैशबोर्ड', 'Your next steps': 'आपके अगले कदम',
    'Prototype data': 'प्रोटोटाइप डेटा', 'Best fit': 'सबसे सही विकल्प', 'fit score': 'मिलान स्कोर',
  },
  'ಕನ್ನಡ': {
    'A short conversation': 'ಒಂದು ಚಿಕ್ಕ ಸಂಭಾಷಣೆ', 'Let’s find what fits your next move.': 'ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆಗೆ ಸೂಕ್ತ ಆಯ್ಕೆ ಹುಡುಕೋಣ.',
    'Your shortlist': 'ನಿಮ್ಮ ಆಯ್ಕೆಗಳು', 'A match you can understand.': 'ನೀವು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬಹುದಾದ ಹೊಂದಾಣಿಕೆ.',
    'Scheme library': 'ಯೋಜನೆಗಳ ಗ್ರಂಥಾಲಯ', 'Browse support, without the fine print fog.': 'ಸಹಾಯ ಯೋಜನೆಗಳನ್ನು ಸುಲಭವಾಗಿ ನೋಡಿ.',
    'Make repayment legible': 'ಮರುಪಾವತಿಯನ್ನು ಸರಳವಾಗಿ ತಿಳಿಯಿರಿ', 'A monthly number you can plan around.': 'ಯೋಜಿಸಬಹುದಾದ ಮಾಸಿಕ ಮೊತ್ತ.',
    'Choose your route': 'ನಿಮ್ಮ ದಾರಿ ಆಯ್ಕೆಮಾಡಿ', 'A nearby partner, with a reason.': 'ಕಾರಣದೊಂದಿಗೆ ಹತ್ತಿರದ ಪಾಲುದಾರ.',
    'A clear next step': 'ಸ್ಪಷ್ಟ ಮುಂದಿನ ಹೆಜ್ಜೆ', 'Start your application, without the overwhelm.': 'ಗೊಂದಲವಿಲ್ಲದೆ ಅರ್ಜಿ ಪ್ರಾರಂಭಿಸಿ.',
    'Keep moving': 'ಮುಂದುವರಿಯಿರಿ', 'Track your application, one step at a time.': 'ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಹಂತ ಹಂತವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    'Your Sathi dashboard': 'ನಿಮ್ಮ ಸಾಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'Your next steps': 'ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆಗಳು',
    'Prototype data': 'ಮಾದರಿ ಡೇಟಾ', 'Best fit': 'ಅತ್ಯುತ್ತಮ ಹೊಂದಾಣಿಕೆ', 'fit score': 'ಹೊಂದಾಣಿಕೆ ಸ್ಕೋರ್',
  },
};

const copy: Record<Language, Record<string, string>> = {
  English: {
    explore: 'Explore', manage: 'Manage', home: 'Home', find: 'Find my scheme', browse: 'Browse schemes',
    calculator: 'EMI calculator', track: 'Track application', overview: 'Overview', applications: 'Applications',
    partners: 'Partners', schemes: 'Schemes', analytics: 'Analytics', start: 'Start an application',
    public: 'A public-service companion', authority: 'Authority workspace', language: 'English',
    findCta: 'Find my scheme', trackCta: 'I have an application', finance: 'Finance, made human',
    forPeople: 'For entrepreneurs & students', heroTitle: 'Your next step', heroAccent: 'starts here.',
    heroBody: 'SchemeSathi turns a confusing financial need into a clear path: understand your need, find a fit, meet the right partner, and keep moving.',
    tell: 'Tell us about you', tellBody: 'A few simple questions about your work, study and need.',
    why: 'See the why', whyBody: 'Compare scheme matches with plain-language reasons, not black boxes.',
    route: 'Choose your route', routeBody: 'Get connected to a partner who serves your area and scheme.',
    eligibilityTitle: 'Let’s find what fits your next move.', continue: 'Continue', back: 'Back', backHome: 'Back home',
    showMatches: 'Show my matches', finding: 'Finding your fit…', browseTitle: 'Browse support, without the fine print fog.',
    calculatorTitle: 'A monthly number you can plan around.', calculate: 'Calculate my EMI', prototype: 'Prototype data',
  },
  'हिन्दी': {
    explore: 'देखें', manage: 'प्रबंधन', home: 'होम', find: 'मेरी योजना खोजें', browse: 'योजनाएँ देखें',
    calculator: 'ईएमआई कैलकुलेटर', track: 'आवेदन ट्रैक करें', overview: 'सारांश', applications: 'आवेदन',
    partners: 'साझेदार', schemes: 'योजनाएँ', analytics: 'विश्लेषण', start: 'आवेदन शुरू करें',
    public: 'जन सेवा सहायक', authority: 'प्राधिकरण कार्यक्षेत्र', language: 'हिन्दी',
    findCta: 'मेरी योजना खोजें', trackCta: 'मेरा आवेदन है', finance: 'वित्तीय सहायता, सरल भाषा में',
    forPeople: 'उद्यमियों और विद्यार्थियों के लिए', heroTitle: 'आपका अगला कदम', heroAccent: 'यहाँ से शुरू होता है।',
    heroBody: 'SchemeSathi आपकी वित्तीय ज़रूरत को एक स्पष्ट रास्ते में बदलता है: ज़रूरत समझें, सही योजना चुनें और सही साझेदार से जुड़ें।',
    tell: 'अपने बारे में बताएँ', tellBody: 'आपके काम, पढ़ाई और ज़रूरत के बारे में कुछ आसान सवाल।',
    why: 'कारण समझें', whyBody: 'योजना मिलान को सरल भाषा में समझें, किसी बंद डिब्बे की तरह नहीं।',
    route: 'अपना रास्ता चुनें', routeBody: 'अपने क्षेत्र और योजना के लिए सही साझेदार से जुड़ें।',
    eligibilityTitle: 'आपके अगले कदम के लिए सही विकल्प खोजें।', continue: 'आगे बढ़ें', back: 'पीछे', backHome: 'होम पर जाएँ',
    showMatches: 'मेरी योजनाएँ दिखाएँ', finding: 'आपके लिए सही योजना खोज रहे हैं…', browseTitle: 'सहायता योजनाएँ आसानी से देखें।',
    calculatorTitle: 'ऐसी मासिक राशि जिसे आप योजना में शामिल कर सकें।', calculate: 'ईएमआई निकालें', prototype: 'प्रोटोटाइप डेटा',
  },
  'ಕನ್ನಡ': {
    explore: 'ಅನ್ವೇಷಿಸಿ', manage: 'ನಿರ್ವಹಣೆ', home: 'ಮುಖಪುಟ', find: 'ನನ್ನ ಯೋಜನೆ ಹುಡುಕಿ', browse: 'ಯೋಜನೆಗಳನ್ನು ನೋಡಿ',
    calculator: 'EMI ಕ್ಯಾಲ್ಕುಲೇಟರ್', track: 'ಅರ್ಜಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', overview: 'ಅವಲೋಕನ', applications: 'ಅರ್ಜಿಗಳು',
    partners: 'ಪಾಲುದಾರರು', schemes: 'ಯೋಜನೆಗಳು', analytics: 'ವಿಶ್ಲೇಷಣೆ', start: 'ಅರ್ಜಿ ಪ್ರಾರಂಭಿಸಿ',
    public: 'ಸಾರ್ವಜನಿಕ ಸೇವಾ ಸಹಾಯಕ', authority: 'ಪ್ರಾಧಿಕಾರ ಕಾರ್ಯಕ್ಷೇತ್ರ', language: 'ಕನ್ನಡ',
    findCta: 'ನನ್ನ ಯೋಜನೆ ಹುಡುಕಿ', trackCta: 'ನನ್ನಲ್ಲಿ ಅರ್ಜಿ ಇದೆ', finance: 'ಹಣಕಾಸು ನೆರವು, ಸರಳವಾಗಿ',
    forPeople: 'ಉದ್ಯಮಿಗಳು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿಗಳಿಗಾಗಿ', heroTitle: 'ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆ', heroAccent: 'ಇಲ್ಲಿಂದ ಆರಂಭ.',
    heroBody: 'SchemeSathi ನಿಮ್ಮ ಹಣಕಾಸಿನ ಅಗತ್ಯವನ್ನು ಸ್ಪಷ್ಟ ದಾರಿಯನ್ನಾಗಿ ಮಾಡುತ್ತದೆ: ಅಗತ್ಯ ತಿಳಿದು, ಸೂಕ್ತ ಯೋಜನೆ ಮತ್ತು ಪಾಲುದಾರರನ್ನು ಹುಡುಕಿ.',
    tell: 'ನಿಮ್ಮ ಬಗ್ಗೆ ತಿಳಿಸಿ', tellBody: 'ನಿಮ್ಮ ಕೆಲಸ, ವಿದ್ಯಾಭ್ಯಾಸ ಮತ್ತು ಅಗತ್ಯದ ಕುರಿತು ಕೆಲವು ಸರಳ ಪ್ರಶ್ನೆಗಳು.',
    why: 'ಕಾರಣ ತಿಳಿಯಿರಿ', whyBody: 'ಯೋಜನೆ ಹೊಂದಾಣಿಕೆಯನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.',
    route: 'ನಿಮ್ಮ ದಾರಿ ಆಯ್ಕೆಮಾಡಿ', routeBody: 'ನಿಮ್ಮ ಪ್ರದೇಶ ಮತ್ತು ಯೋಜನೆಗೆ ಸೂಕ್ತ ಪಾಲುದಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    eligibilityTitle: 'ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆಗೆ ಸೂಕ್ತ ಆಯ್ಕೆಯನ್ನು ಹುಡುಕೋಣ.', continue: 'ಮುಂದುವರಿಸಿ', back: 'ಹಿಂದೆ', backHome: 'ಮುಖಪುಟಕ್ಕೆ',
    showMatches: 'ನನ್ನ ಹೊಂದಾಣಿಕೆಗಳನ್ನು ತೋರಿಸಿ', finding: 'ನಿಮಗಾಗಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ…', browseTitle: 'ಸಹಾಯ ಯೋಜನೆಗಳನ್ನು ಸುಲಭವಾಗಿ ನೋಡಿ.',
    calculatorTitle: 'ಯೋಜಿಸಬಹುದಾದ ಮಾಸಿಕ ಮೊತ್ತ.', calculate: 'ನನ್ನ EMI ಲೆಕ್ಕಿಸಿ', prototype: 'ಮಾದರಿ ಡೇಟಾ',
  },
};

const LanguageContext = createContext<{ lang: Language; setLang: (lang: Language) => void; t: (key: string) => string } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('ss_lang') as Language) || 'English');
  const change = (next: Language) => { setLang(next); localStorage.setItem('ss_lang', next); };
  const value = useMemo(() => ({ lang, setLang: change, t: (key: string) => copy[lang][key] || copy.English[key] || key }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

export function translatePhrase(lang: Language, text: string) {
  return phrases[lang][text] || text;
}