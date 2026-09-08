import { useState } from 'react';
import { ArrowRight, LocateFixed, Navigation, Search } from 'lucide-react';
import { Link } from 'wouter';
import { PartnerMap } from './partner-map';
import { useLanguage } from '../i18n';

type LocatedPartner = {
  id: string; name: string; type: string; latitude?: number; longitude?: number;
  distanceKm: number; score: number; eligible: boolean; status: string;
  fundUtilizationPercent: number; npaStatus: string; processingCapacityStatus: string;
  eligibilityReasons: string[]; reasons: string[];
};
type LocatorResponse = { userLocation: { latitude: number; longitude: number }; recommendedPartnerId: string | null; partners: LocatedPartner[] };

export default function PartnerLocator() {
  const { t } = useLanguage();
  const [pincode, setPincode] = useState('560001');
  const [data, setData] = useState<LocatorResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const params = new URLSearchParams(location.search);
  const matches = JSON.parse(localStorage.getItem('ss_matches') || '[]') as Array<{ id: string }>;
  const schemeId = params.get('scheme') || matches[0]?.id || 'micro-finance';

  const findPartners = async (query: string) => {
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`/api/partners/eligible?schemeId=${encodeURIComponent(schemeId)}&${query}`);
      if (!response.ok) throw new Error('Partner search failed');
      const result = await response.json() as LocatorResponse;
      setData(result); setSelectedId(result.recommendedPartnerId || undefined);
    } catch { setMessage('We could not load partner availability. Please try again.'); }
    finally { setLoading(false); }
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setMessage('Location is not available in this browser. Please enter your PIN code.'); return; }
    navigator.geolocation.getCurrentPosition(
      position => findPartners(`latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`),
      () => setMessage('Location access was denied. Please enter your PIN code manually.'),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  };
  const selected = data?.partners.find(partner => partner.id === selectedId);
  const eligible = data?.partners.filter(partner => partner.eligible) || [];
  const directions = selected ? `https://www.openstreetmap.org/directions?from=${data?.userLocation.latitude},${data?.userLocation.longitude}&to=${selected.latitude},${selected.longitude}` : '#';

  return <div className="mx-auto max-w-6xl px-5 py-10 lg:px-10 lg:py-14">
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[.19em] text-[hsl(var(--primary))]">{t('partnerLocator')}</p>
    <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-.055em] md:text-5xl">{t('findEligible')}</h1>
    <p className="mt-4 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">{t('locatorSubtitle')}</p>
    <div className="my-8 flex flex-wrap items-end gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 card-shadow">
      <label className="min-w-[220px] flex-1 text-sm font-semibold"><span className="mb-2 block">{t('enterPin')}</span><input aria-label={t('enterPin')} value={pincode} onChange={event => setPincode(event.target.value)} placeholder="6-digit Indian PIN code" className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" /></label>
      <button type="button" onClick={() => /^\d{6}$/.test(pincode) ? findPartners(`pincode=${pincode}`) : setMessage('Enter a valid 6-digit Indian PIN code.')} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-50"><Search size={16} /> {t('findPartners')}</button>
      <button type="button" onClick={useCurrentLocation} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm font-bold disabled:opacity-50"><LocateFixed size={16} /> {t('currentLocation')}</button>
    </div>
    {message && <div role="alert" className="mb-6 rounded-xl bg-[hsl(var(--secondary))] p-4 text-sm font-semibold">{message}</div>}
    {loading && <div className="mb-6 rounded-xl bg-[hsl(var(--secondary))] p-4 text-sm font-semibold">{t('finding')}</div>}
    {data && <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="order-2 lg:order-1"><PartnerMap latitude={data.userLocation.latitude} longitude={data.userLocation.longitude} partners={data.partners} selectedId={selectedId} onSelect={setSelectedId} /></div>
      <div className="order-1 space-y-5 lg:order-2">
        {selected && <article className="rounded-2xl border border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] shadow-lg"><p className="text-xs font-bold uppercase tracking-[.16em] opacity-70">{t('recommendedPartner')}</p><h2 className="mt-3 font-display text-2xl font-bold">{selected.name}</h2><p className="mt-1 text-sm opacity-75">{selected.type} · {selected.distanceKm} km · score {selected.score}/100</p><div className="mt-5 grid gap-2 text-sm">{selected.reasons.map(reason => <span key={reason}>✓ {reason}</span>)}</div><div className="mt-6 flex flex-wrap gap-3"><a href={directions} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-4 py-3 text-sm font-bold text-[hsl(var(--accent-foreground))]"><Navigation size={15} /> {t('getDirections')}</a><Link href={`/application?scheme=${schemeId}&partner=${selected.id}`} className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--primary-foreground)/.3)] px-4 py-3 text-sm font-bold">{t('applyHere')} <ArrowRight size={15} /></Link></div></article>}
        <div><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-bold">{t('eligiblePartners')}</h2><span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{eligible.length} {t('canReceive')}</span></div><div className="space-y-3">{eligible.map(partner => <button type="button" key={partner.id} onClick={() => setSelectedId(partner.id)} className={`w-full rounded-2xl border bg-[hsl(var(--card))] p-4 text-left ${selectedId === partner.id ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/.12)]' : 'border-[hsl(var(--card-border))]'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-display font-bold">{partner.name}</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{partner.type} · {partner.distanceKm} km · score {partner.score}</p></div><span className="rounded-full bg-[hsl(var(--primary)/.12)] px-2.5 py-1 text-[10px] font-bold">{partner.status === 'ELIGIBLE' ? t('eligible') : t('limited')}</span></div><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{t('fundUtilization')} {partner.fundUtilizationPercent}% · {t('npa')} {partner.npaStatus.replace('_', ' ').toLowerCase()} · {partner.processingCapacityStatus.toLowerCase()}</p></button>)}</div></div>
        {data.partners.some(partner => !partner.eligible) && <details className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"><summary className="cursor-pointer text-sm font-bold">{t('viewUnavailable')}</summary><div className="mt-4 space-y-3">{data.partners.filter(partner => !partner.eligible).map(partner => <div key={partner.id} className="rounded-xl bg-[hsl(var(--secondary))] p-3 text-sm"><strong>{partner.name}</strong><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{partner.eligibilityReasons.join(' · ')}</p></div>)}</div></details>}
      </div>
    </div>}
    {!data && !loading && <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-10 text-center"><h2 className="font-display text-lg font-bold">{t('startLocation')}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('locationBody')}</p></div>}
  </div>;
}
