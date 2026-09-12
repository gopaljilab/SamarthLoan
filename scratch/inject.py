import re

app_file = 'artifacts/schemesathi/src/App.tsx'

with open(app_file, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Add useLanguage to MatchCard if missing
if "const { t } = useLanguage();" not in app_content:
    app_content = app_content.replace('function MatchCard({ match, rank }: { match: SchemeMatch; rank: number }) { const [open, setOpen] = useState(rank === 1);', 'function MatchCard({ match, rank }: { match: SchemeMatch; rank: number }) { const [open, setOpen] = useState(rank === 1); const { t } = useLanguage();')

# Home
app_content = app_content.replace("'Takes about 2 minutes'", "t('takes2Mins')")
app_content = app_content.replace("'See clear reasons for each match'", "t('seeReasons')")
app_content = app_content.replace("'Choose a nearby eligible partner'", "t('chooseNearby')")
app_content = app_content.replace(">Start where you are<", ">{t('startWhereYouAre')}<")
app_content = app_content.replace(">Clarity is a service.<", ">{t('clarityService')}<")
app_content = app_content.replace(">Your first conversation should not require financial vocabulary.<", ">{t('firstConversation')}<")
app_content = app_content.replace(">Prototype promise<", ">{t('prototypePromise')}<")
app_content = app_content.replace(">Clearer choices. Simpler next steps. Better access to the right financial route.<", ">{t('clearerChoices')}<")
app_content = app_content.replace(">See the repayment calculator ", ">{t('seeRepayment')} ")

# Shell Footer
app_content = app_content.replace(">SamarthLoan prototype · Built for clearer public finance<", ">{t('footer1')}<")
app_content = app_content.replace(">Information is illustrative. Final approval rests with the partner.<", ">{t('footer2')}<")

# Recommendations
app_content = app_content.replace("body={`Based on ${profile.name || 'your answers'}’s stated need. Scores are guidance, not a promise of approval.`}", "body={t('recommendationBody').replace('{name}', profile.name || t('yourAnswers'))}")

# MatchCard
app_content = app_content.replace(">Up to<", ">{t('upTo')}<")
app_content = app_content.replace(">Illustrative interest<", ">{t('illustrativeInterest')}<")
app_content = app_content.replace(">Repayment window<", ">{t('repaymentWindow')}<")
app_content = app_content.replace("{open ? 'Hide why this fits' : 'Show why this fits'}", "{open ? t('hideWhyFits') : t('showWhyFits')}")
app_content = app_content.replace(">View scheme ", ">{t('viewScheme')} ")
app_content = app_content.replace("> Estimate EMI<", "> {t('estimateEMI')}<")

# Track
app_content = app_content.replace("'Enter your application ID to see the latest stage. For this prototype, your submitted enquiry is available on this device.'", "t('trackSubtitle')")
app_content = app_content.replace("'Application received', 'Partner review', 'Documents checked', 'Decision shared'", "t('status1'), t('status2'), t('status3'), t('status4')")
app_content = app_content.replace("Your application is in the queue for a partner conversation. You will be contacted through the details you shared.", "{t('trackQueueBody')}")


with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Done")