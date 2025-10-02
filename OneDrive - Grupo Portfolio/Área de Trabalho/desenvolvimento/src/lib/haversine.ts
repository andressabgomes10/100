/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param lat1 Latitude do primeiro ponto em graus
 * @param lng1 Longitude do primeiro ponto em graus
 * @param lat2 Latitude do segundo ponto em graus
 * @param lng2 Longitude do segundo ponto em graus
 * @returns Distância em quilômetros
 */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Raio da Terra em quilômetros
  const R = 6371;

  // Converter graus para radianos
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Converte graus para radianos
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Valida se as coordenadas são válidas
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

/**
 * Calcula a distância entre dois pontos, retornando null se as coordenadas forem inválidas
 */
export function safeHaversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number | null {
  if (
    !isValidCoordinates(lat1, lng1) ||
    !isValidCoordinates(lat2, lng2)
  ) {
    return null;
  }

  return haversine(lat1, lng1, lat2, lng2);
}
