export type PartnerStatus = "ELIGIBLE" | "LIMITED" | "UNAVAILABLE";

export type PartnerRecord = {
  id: string;
  name: string;
  type: "SCA" | "PSB" | "RRB" | "NBFC-MFI" | "BANK";
  supportedSchemes: string[];
  serviceArea: string;
  address: string;
  latitude: number;
  longitude: number;
  authorized: boolean;
  active: boolean;
  fundUtilizationPercent: number;
  npaPercent: number;
  overduePercent: number;
  processingCapacity: number;
  applicationsToday: number;
  acceptingApplications: boolean;
  serviceQuality: number;
  lastUpdated: string;
};

export const partnerPolicy = {
  maxFundUtilizationPercent: 85,
  maxNpaPercent: 5,
  maxOverduePercent: 5,
  minProcessingCapacity: 15,
  weights: { scheme: 40, funds: 25, distance: 20, capacity: 10, service: 5 },
};

// Prototype / simulated partner data. Production values must come from verified partner feeds.
export const partners: PartnerRecord[] = [
  {
    id: "p1", name: "Bengaluru Enterprise Support Centre", type: "SCA",
    supportedSchemes: ["micro-finance", "term-loan"], serviceArea: "Central Bengaluru",
    address: "14 Residency Road, Bengaluru", latitude: 12.9716, longitude: 77.5946,
    authorized: true, active: true, fundUtilizationPercent: 72, npaPercent: 2.1,
    overduePercent: 1.8, processingCapacity: 86, applicationsToday: 18,
    acceptingApplications: true, serviceQuality: 92, lastUpdated: "2026-09-08T09:00:00.000Z",
  },
  {
    id: "p2", name: "Karnataka Gramin Bank - Indiranagar", type: "RRB",
    supportedSchemes: ["micro-finance", "term-loan", "equipment-support"], serviceArea: "East Bengaluru",
    address: "100 Feet Road, Indiranagar, Bengaluru", latitude: 12.9784, longitude: 77.6408,
    authorized: true, active: true, fundUtilizationPercent: 82, npaPercent: 2.8,
    overduePercent: 2.4, processingCapacity: 28, applicationsToday: 31,
    acceptingApplications: true, serviceQuality: 88, lastUpdated: "2026-09-08T08:30:00.000Z",
  },
  {
    id: "p3", name: "Udyam MFI - Jayanagar", type: "NBFC-MFI",
    supportedSchemes: ["micro-finance", "working-capital"], serviceArea: "South Bengaluru",
    address: "4th Block, Jayanagar, Bengaluru", latitude: 12.925, longitude: 77.5938,
    authorized: true, active: true, fundUtilizationPercent: 68, npaPercent: 7.2,
    overduePercent: 6.1, processingCapacity: 68, applicationsToday: 14,
    acceptingApplications: true, serviceQuality: 81, lastUpdated: "2026-09-08T07:45:00.000Z",
  },
  {
    id: "p4", name: "People's Development Finance", type: "SCA",
    supportedSchemes: ["micro-finance", "education-loan"], serviceArea: "North Bengaluru",
    address: "Yeshwanthpur, Bengaluru", latitude: 13.028, longitude: 77.54,
    authorized: true, active: false, fundUtilizationPercent: 44, npaPercent: 1.4,
    overduePercent: 1.2, processingCapacity: 72, applicationsToday: 10,
    acceptingApplications: false, serviceQuality: 76, lastUpdated: "2026-09-07T16:00:00.000Z",
  },
  {
    id: "p5", name: "National Public Bank - Koramangala", type: "PSB",
    supportedSchemes: ["term-loan", "education-loan", "equipment-support"], serviceArea: "South-East Bengaluru",
    address: "80 Feet Road, Koramangala, Bengaluru", latitude: 12.9352, longitude: 77.6245,
    authorized: true, active: true, fundUtilizationPercent: 61, npaPercent: 1.9,
    overduePercent: 1.5, processingCapacity: 91, applicationsToday: 8,
    acceptingApplications: true, serviceQuality: 89, lastUpdated: "2026-09-08T09:15:00.000Z",
  },
];

export type UserLocation = { latitude: number; longitude: number; source: "browser" | "pincode" };

export function normalizeSchemeId(schemeId: string) {
  return schemeId === "udyam-sakhi" ? "micro-finance" : schemeId;
}

export function haversineDistanceKm(from: UserLocation, to: Pick<PartnerRecord, "latitude" | "longitude">) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const latitude1 = (from.latitude * Math.PI) / 180;
  const latitude2 = (to.latitude * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function eligibilityReasons(partner: PartnerRecord, schemeId: string) {
  const reasons: string[] = [];
  if (!partner.authorized) reasons.push("Partner authorization is not active");
  if (!partner.supportedSchemes.includes(schemeId)) reasons.push("Selected scheme is not supported");
  if (!partner.active) reasons.push("Partner is currently inactive");
  if (!partner.acceptingApplications) reasons.push("Partner is not accepting applications");
  if (partner.fundUtilizationPercent > partnerPolicy.maxFundUtilizationPercent) reasons.push("Fund utilization is above the configured threshold");
  if (partner.npaPercent > partnerPolicy.maxNpaPercent) reasons.push("NPA is above the configured threshold");
  if (partner.overduePercent > partnerPolicy.maxOverduePercent) reasons.push("Overdue rate is above the configured threshold");
  if (partner.processingCapacity < partnerPolicy.minProcessingCapacity) reasons.push("Processing capacity is currently limited");
  return reasons;
}

function toStatus(partner: PartnerRecord, reasons: string[]): PartnerStatus {
  if (reasons.length > 0) return "UNAVAILABLE";
  if (partner.fundUtilizationPercent >= 75 || partner.processingCapacity < 35) return "LIMITED";
  return "ELIGIBLE";
}

export function getEligiblePartners(schemeId: string, location: UserLocation) {
  schemeId = normalizeSchemeId(schemeId);
  return partners.map((partner) => {
    const distanceKm = haversineDistanceKm(location, partner);
    const reasons = eligibilityReasons(partner, schemeId);
    const status = toStatus(partner, reasons);
    const fundScore = Math.max(0, 100 - partner.fundUtilizationPercent);
    const distanceScore = Math.max(0, 100 - distanceKm * 8);
    const score = Math.round(
      partnerPolicy.weights.scheme * (partner.supportedSchemes.includes(schemeId) ? 1 : 0) +
      partnerPolicy.weights.funds * (fundScore / 100) +
      partnerPolicy.weights.distance * (distanceScore / 100) +
      partnerPolicy.weights.capacity * (partner.processingCapacity / 100) +
      partnerPolicy.weights.service * (partner.serviceQuality / 100),
    );
    return {
      ...partner,
      distance: Number(distanceKm.toFixed(1)), distanceKm: Number(distanceKm.toFixed(1)),
      score: status === "UNAVAILABLE" ? 0 : score, status, eligible: status !== "UNAVAILABLE",
      schemeSupported: partner.supportedSchemes.includes(schemeId),
      npaStatus: partner.npaPercent <= partnerPolicy.maxNpaPercent ? "WITHIN_THRESHOLD" : "ABOVE_THRESHOLD",
      overdueStatus: partner.overduePercent <= partnerPolicy.maxOverduePercent ? "WITHIN_THRESHOLD" : "ABOVE_THRESHOLD",
      processingCapacityStatus: partner.processingCapacity >= partnerPolicy.minProcessingCapacity ? "AVAILABLE" : "LIMITED",
      eligibilityReasons: reasons,
      reasons: reasons.length ? reasons : [
        "Supports your selected scheme", "Authorized channel partner",
        "Fund utilization is within the configured threshold", "NPA and overdue rates are within thresholds",
        "Currently accepting applications", `${Number(distanceKm.toFixed(1))} km from your location`,
        "Processing capacity is available",
      ],
    };
  }).sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.score - a.score;
  });
}

export function resolvePincode(pincode: string): UserLocation | null {
  const locations: Record<string, [number, number]> = {
    "560001": [12.9716, 77.5946], "560011": [12.925, 77.5938], "560038": [12.9784, 77.6408],
  };
  const coordinates = locations[pincode];
  return coordinates ? { latitude: coordinates[0], longitude: coordinates[1], source: "pincode" } : null;
}