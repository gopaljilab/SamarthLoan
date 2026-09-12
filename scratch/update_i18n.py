import re

i18n_file = 'artifacts/schemesathi/src/i18n.tsx'

with open(i18n_file, 'r', encoding='utf-8') as f:
    i18n_content = f.read()

en_additions = {
    'takes2Mins': 'Takes about 2 minutes',
    'seeReasons': 'See clear reasons for each match',
    'chooseNearby': 'Choose a nearby eligible partner',
    'startWhereYouAre': 'Start where you are',
    'clarityService': 'Clarity is a service.',
    'firstConversation': 'Your first conversation should not require financial vocabulary.',
    'prototypePromise': 'Prototype promise',
    'clearerChoices': 'Clearer choices. Simpler next steps. Better access to the right financial route.',
    'seeRepayment': 'See the repayment calculator',
    'footer1': 'SamarthLoan prototype · Built for clearer public finance',
    'footer2': 'Information is illustrative. Final approval rests with the partner.',
    'upTo': 'Up to',
    'illustrativeInterest': 'Illustrative interest',
    'repaymentWindow': 'Repayment window',
    'hideWhyFits': 'Hide why this fits',
    'showWhyFits': 'Show why this fits',
    'viewScheme': 'View scheme',
    'estimateEMI': 'Estimate EMI',
    'trackSubtitle': 'Enter your application ID to see the latest stage. For this prototype, your submitted enquiry is available on this device.',
    'status1': 'Application received',
    'status2': 'Partner review',
    'status3': 'Documents checked',
    'status4': 'Decision shared',
    'trackQueueBody': 'Your application is in the queue for a partner conversation. You will be contacted through the details you shared.',
    'recommendationBody': 'Based on {name}’s stated need. Scores are guidance, not a promise of approval.',
    'yourAnswers': 'your answers'
}

hi_additions = {
    'takes2Mins': 'लगभग 2 मिनट का समय लगता है',
    'seeReasons': 'प्रत्येक योजना के लिए स्पष्ट कारण देखें',
    'chooseNearby': 'आस-पास के योग्य साझेदार चुनें',
    'startWhereYouAre': 'आप जहां हैं वहीं से शुरू करें',
    'clarityService': 'स्पष्टता एक सेवा है।',
    'firstConversation': 'आपकी पहली बातचीत में वित्तीय शब्दावली की आवश्यकता नहीं होनी चाहिए।',
    'prototypePromise': 'प्रोटोटाइप वादा',
    'clearerChoices': 'स्पष्ट विकल्प। सरल अगले कदम। सही वित्तीय मार्ग तक बेहतर पहुंच।',
    'seeRepayment': 'ईएमआई कैलकुलेटर देखें',
    'footer1': 'समर्थलोन प्रोटोटाइप · स्पष्ट सार्वजनिक वित्त के लिए निर्मित',
    'footer2': 'जानकारी केवल उदाहरण के लिए है। अंतिम स्वीकृति साझेदार पर निर्भर करती है।',
    'upTo': 'अधिकतम',
    'illustrativeInterest': 'अनुमानित ब्याज',
    'repaymentWindow': 'भुगतान की अवधि',
    'hideWhyFits': 'यह क्यों उपयुक्त है, छुपाएं',
    'showWhyFits': 'यह क्यों उपयुक्त है, दिखाएं',
    'viewScheme': 'योजना देखें',
    'estimateEMI': 'ईएमआई निकालें',
    'trackSubtitle': 'नवीनतम चरण देखने के लिए अपना एप्लिकेशन आईडी दर्ज करें। इस प्रोटोटाइप के लिए, आपकी सबमिट की गई पूछताछ इस डिवाइस पर उपलब्ध है।',
    'status1': 'आवेदन प्राप्त हुआ',
    'status2': 'साझेदार की समीक्षा',
    'status3': 'दस्तावेजों की जांच की गई',
    'status4': 'निर्णय साझा किया गया',
    'trackQueueBody': 'आपका आवेदन साझेदार से बातचीत के लिए कतार में है। आपके द्वारा साझा किए गए विवरण के माध्यम से आपसे संपर्क किया जाएगा।',
    'recommendationBody': '{name} की बताई गई जरूरत के आधार पर। स्कोर केवल मार्गदर्शन के लिए हैं, स्वीकृति का वादा नहीं।',
    'yourAnswers': 'आपके उत्तर'
}

kn_additions = {
    'takes2Mins': 'ಸುಮಾರು 2 ನಿಮಿಷಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ',
    'seeReasons': 'ಪ್ರತಿ ಹೊಂದಾಣಿಕೆಗೆ ಸ್ಪಷ್ಟ ಕಾರಣಗಳನ್ನು ನೋಡಿ',
    'chooseNearby': 'ಹತ್ತಿರದ ಅರ್ಹ ಪಾಲುದಾರರನ್ನು ಆರಿಸಿ',
    'startWhereYouAre': 'ನೀವು ಎಲ್ಲಿದ್ದೀರೋ ಅಲ್ಲಿಂದಲೇ ಪ್ರಾರಂಭಿಸಿ',
    'clarityService': 'ಸ್ಪಷ್ಟತೆಯೇ ಒಂದು ಸೇವೆ.',
    'firstConversation': 'ನಿಮ್ಮ ಮೊದಲ ಸಂಭಾಷಣೆಗೆ ಹಣಕಾಸು ಶಬ್ದಕೋಶದ ಅಗತ್ಯವಿಲ್ಲ.',
    'prototypePromise': 'ಮಾದರಿ ಭರವಸೆ',
    'clearerChoices': 'ಸ್ಪಷ್ಟ ಆಯ್ಕೆಗಳು. ಸರಳ ಮುಂದಿನ ಹೆಜ್ಜೆಗಳು. ಸರಿಯಾದ ಹಣಕಾಸಿನ ದಾರಿಗೆ ಉತ್ತಮ ಪ್ರವೇಶ.',
    'seeRepayment': 'ಮರುಪಾವತಿ ಕ್ಯಾಲ್ಕುಲೇಟರ್ ನೋಡಿ',
    'footer1': 'ಸಮರ್ಥ್‌ಲೋನ್ ಮಾದರಿ · ಸ್ಪಷ್ಟ ಸಾರ್ವಜನಿಕ ಹಣಕಾಸಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ',
    'footer2': 'ಮಾಹಿತಿಯು ಕೇವಲ ಉದಾಹರಣೆಗಾಗಿ. ಅಂತಿಮ ಅನುಮೋದನೆಯು ಪಾಲುದಾರರ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ.',
    'upTo': 'ಗರಿಷ್ಠ',
    'illustrativeInterest': 'ಅಂದಾಜು ಬಡ್ಡಿ',
    'repaymentWindow': 'ಮರುಪಾವತಿ ಅವಧಿ',
    'hideWhyFits': 'ಇದು ಏಕೆ ಸೂಕ್ತವಾಗಿದೆ, ಮರೆಮಾಡಿ',
    'showWhyFits': 'ಇದು ಏಕೆ ಸೂಕ್ತವಾಗಿದೆ, ತೋರಿಸಿ',
    'viewScheme': 'ಯೋಜನೆಯನ್ನು ನೋಡಿ',
    'estimateEMI': 'ಇಎಂಐ ಅಂದಾಜಿಸಿ',
    'trackSubtitle': 'ಇತ್ತೀಚಿನ ಹಂತವನ್ನು ನೋಡಲು ನಿಮ್ಮ ಅಪ್ಲಿಕೇಶನ್ ಐಡಿಯನ್ನು ನಮೂದಿಸಿ. ಈ ಮಾದರಿಗಾಗಿ, ನೀವು ಸಲ್ಲಿಸಿದ ವಿಚಾರಣೆ ಈ ಸಾಧನದಲ್ಲಿ ಲಭ್ಯವಿದೆ.',
    'status1': 'ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    'status2': 'ಪಾಲುದಾರರ ಪರಿಶೀಲನೆ',
    'status3': 'ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    'status4': 'ನಿರ್ಧಾರ ಹಂಚಿಕೊಳ್ಳಲಾಗಿದೆ',
    'trackQueueBody': 'ನಿಮ್ಮ ಅರ್ಜಿಯು ಪಾಲುದಾರರೊಂದಿಗೆ ಸಂಭಾಷಣೆಗಾಗಿ ಸರದಿಯಲ್ಲಿದೆ. ನೀವು ಹಂಚಿಕೊಂಡ ವಿವರಗಳ ಮೂಲಕ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲಾಗುತ್ತದೆ.',
    'recommendationBody': '{name} ಅವರ ಅಗತ್ಯದ ಆಧಾರದ ಮೇಲೆ. ಸ್ಕೋರ್‌ಗಳು ಕೇವಲ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ, ಅನುಮೋದನೆಯ ಭರವಸೆಯಲ್ಲ.',
    'yourAnswers': 'ನಿಮ್ಮ ಉತ್ತರಗಳು'
}

def insert_dict(lang_content, var_name, dict_data):
    # Find where the dict ends
    match = re.search(r"const " + var_name + r": Dictionary = \{(.*?)\n\};", lang_content, re.DOTALL)
    if not match: return lang_content
    
    dict_str = match.group(1)
    
    # Append new keys
    for k, v in dict_data.items():
        dict_str += f", {k}: '{v.replace(chr(39), chr(92)+chr(39))}'"
        
    return lang_content[:match.start(1)] + dict_str + lang_content[match.end(1):]


i18n_content = insert_dict(i18n_content, 'english', en_additions)
i18n_content = insert_dict(i18n_content, 'hindi', hi_additions)
i18n_content = insert_dict(i18n_content, 'kannada', kn_additions)

with open(i18n_file, 'w', encoding='utf-8') as f:
    f.write(i18n_content)

print("i18n updated!")
