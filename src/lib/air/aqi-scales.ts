/**
 * One of the six air quality levels shared by the US AQI and CPCB scales.
 */
export type AqiLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * A category label paired with its severity level.
 */
export interface AqiCategory {
  label: string;
  level: AqiLevel;
}

/**
 * Maps a US AQI value to its category and severity level.
 */
export function usAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) {
    return { label: "Good", level: 0 };
  }
  if (aqi <= 100) {
    return { label: "Moderate", level: 1 };
  }
  if (aqi <= 150) {
    return { label: "Unhealthy for Sensitive Groups", level: 2 };
  }
  if (aqi <= 200) {
    return { label: "Unhealthy", level: 3 };
  }
  if (aqi <= 300) {
    return { label: "Very Unhealthy", level: 4 };
  }
  return { label: "Hazardous", level: 5 };
}

/**
 * Maps a PM2.5 value to its Indian CPCB category and severity level.
 */
export function cpcbPm25Category(pm25: number): AqiCategory {
  if (pm25 <= 30) {
    return { label: "Good", level: 0 };
  }
  if (pm25 <= 60) {
    return { label: "Satisfactory", level: 1 };
  }
  if (pm25 <= 90) {
    return { label: "Moderate", level: 2 };
  }
  if (pm25 <= 120) {
    return { label: "Poor", level: 3 };
  }
  if (pm25 <= 250) {
    return { label: "Very Poor", level: 4 };
  }
  return { label: "Severe", level: 5 };
}
