# -*- coding: utf-8 -*-
import re

with open('artifacts/schemesathi/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

funcs_to_inject = ['Home', 'Eligibility']
for func in funcs_to_inject:
    pattern = r'(function ' + func + r'\([^)]*\)\s*\{)'
    replacement = r'\1 const { t } = useLanguage(); '
    content = re.sub(pattern, replacement, content)

replacements = {
    "'Takes about 2 minutes'": "t('takes2Mins')",
    "'Clarity is a service.'": "t('clarityService')",
    "'Prototype promise'": "t('prototypePromise')",
    "'Clearer choices. Simpler next steps. Better access to the right financial route.'": "t('clearerChoices')",
    "'See the repayment calculator'": "t('seeRepayment')",
    "'Your first conversation should not require financial vocabulary.'": "t('firstConversation')",
    "'See clear reasons for each match'": "t('seeReasons')",
    "'Choose a nearby eligible partner'": "t('chooseNearby')",
    "'Start where you are'": "t('startWhereYouAre')",
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open('artifacts/schemesathi/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
