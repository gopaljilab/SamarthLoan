import { db } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export type UserLocation = { latitude: number; longitude: number; source: "browser" | "pincode" };

export function haversineDistanceKm(from: UserLocation, to: { latitude: number; longitude: number }) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const latitude1 = (from.latitude * Math.PI) / 180;
  const latitude2 = (to.latitude * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolvePincode(pincode: string): UserLocation | null {
  // Without a real geocoding provider, we cannot resolve pincodes.
  // Do NOT silently guess coordinates or use fake data.
  return null;
}

export async function getEligiblePartners(schemeId: string, location: UserLocation) {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  
  const { postgresDb, channelPartners, partnerSchemeMappings, partnerOperationalMetrics } = await import("@workspace/db/postgres");

  const results = await postgresDb
    .select({
      partner: channelPartners,
      mapping: partnerSchemeMappings,
      metrics: partnerOperationalMetrics,
    })
    .from(channelPartners)
    .innerJoin(
      partnerSchemeMappings,
      and(
        eq(partnerSchemeMappings.partnerId, channelPartners.id),
        eq(partnerSchemeMappings.schemeId, schemeId)
      )
    )
    .leftJoin(
      partnerOperationalMetrics,
      eq(partnerOperationalMetrics.partnerId, channelPartners.id)
    );

  const mapped = results.map((row) => {
    const { partner, mapping, metrics } = row;
    
    const lat = partner.latitude ? Number(partner.latitude) : null;
    const lng = partner.longitude ? Number(partner.longitude) : null;
    
    let distanceKm = null;
    if (lat !== null && lng !== null) {
      distanceKm = haversineDistanceKm(location, { latitude: lat, longitude: lng });
    }

    const reasons: string[] = [];
    if (!partner.authorizedStatus) reasons.push("Partner authorization is not active");
    if (!mapping.isAuthorized) reasons.push("Partner is not authorized for this scheme");
    if (!partner.acceptingApplications) reasons.push("Partner is not accepting applications");
    
    let operationallyEligible = true;
    if (metrics) {
        if (metrics.acceptingApplications === false) {
            reasons.push("Operational metrics indicate not accepting applications");
            operationallyEligible = false;
        }
    } else {
        reasons.push("Operational eligibility unavailable");
        operationallyEligible = false;
    }

    const eligible = reasons.length === 0 && distanceKm !== null;
    
    return {
      id: partner.id,
      name: partner.name,
      type: partner.partnerType,
      address: partner.address,
      city: partner.city,
      district: partner.district,
      state: partner.state,
      pincode: partner.pincode,
      distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
      schemeEligible: mapping.isAuthorized,
      operationalStatus: operationallyEligible ? "ELIGIBLE" : "UNAVAILABLE",
      verificationStatus: partner.authorizedStatus ? "VERIFIED" : "UNVERIFIED",
      eligible,
      reasons: reasons.length > 0 ? reasons : ["Operationally eligible", "Authorized channel partner", "Supports your selected scheme"],
      contact: {
        phone: partner.phone,
        email: partner.email,
        website: partner.website,
      }
    };
  });

  return mapped.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    if (a.verificationStatus !== b.verificationStatus) return a.verificationStatus === "VERIFIED" ? -1 : 1;
    if (a.operationalStatus !== b.operationalStatus) return a.operationalStatus === "ELIGIBLE" ? -1 : 1;
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    return 0;
  });
}
