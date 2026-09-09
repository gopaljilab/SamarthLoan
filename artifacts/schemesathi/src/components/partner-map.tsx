import { MapPin, Navigation } from 'lucide-react';
import { useLanguage } from '../i18n';

type MapPartner = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  status?: string;
};

type PartnerMapProps = {
  latitude: number;
  longitude: number;
  partners: MapPartner[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export function PartnerMap({ latitude, longitude, partners, selectedId, onSelect }: PartnerMapProps) {
  const { t } = useLanguage();
  const markerPartners = partners.filter((partner) => partner.latitude && partner.longitude);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.08}%2C${latitude - 0.06}%2C${longitude + 0.08}%2C${latitude + 0.06}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  return <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]" aria-label="Partner location map">
    <div className="relative h-[360px]">
      <iframe title="OpenStreetMap partner area" src={mapUrl} className="absolute inset-0 h-full w-full border-0" loading="lazy" />
      <div className="absolute left-3 top-3 rounded-xl bg-[hsl(var(--card)/.94)] px-3 py-2 text-xs font-bold shadow-sm"><MapPin size={14} className="mr-1 inline text-[hsl(var(--primary))]" />Your location</div>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2" aria-label="Partner map markers">
        {markerPartners.map((partner) => <button key={partner.id} type="button" onClick={() => onSelect(partner.id)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold shadow-sm transition-transform hover:-translate-y-0.5 ${selectedId === partner.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--accent))]' : 'border-[hsl(var(--card))] bg-[hsl(var(--card)/.94)]'}`} aria-label={`Select ${partner.name}`}>
          <Navigation size={12} className={partner.status === 'UNAVAILABLE' ? 'text-[hsl(var(--destructive))]' : partner.status === 'LIMITED' ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]'} /> {partner.name} · {partner.distanceKm ?? '-'} km
        </button>)}
      </div>
    </div>
    <p className="border-t border-[hsl(var(--border))] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">{t('mapNote')}</p>
  </div>;
}
