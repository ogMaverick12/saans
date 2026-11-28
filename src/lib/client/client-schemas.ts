import { z } from "zod";
import { AirDigestSchema, AqiLevelSchema } from "@/lib/air/digest-schema";

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

export const GeocodeMatchSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(MIN_LATITUDE).max(MAX_LATITUDE),
  longitude: z.number().min(MIN_LONGITUDE).max(MAX_LONGITUDE),
  countryCode: z.string().nullable(),
  country: z.string().nullable(),
  admin1: z.string().nullable(),
});

/**
 * Air-digest schemas shared with the server.
 */
export { AirDigestSchema, AqiLevelSchema };

export type ClientGeocodeMatch = z.infer<typeof GeocodeMatchSchema>;

export type ClientAirDigest = z.infer<typeof AirDigestSchema>;
