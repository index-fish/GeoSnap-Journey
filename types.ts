
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  country?: string;
  region?: string;
}

export interface ShootingParameters {
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  camera?: string;
}

export interface PhotoEntry {
  id: string;
  url: string;
  title: string;
  description: string;
  date: string;
  location: GeoLocation;
  tags: string[];
  parameters?: ShootingParameters;
  user_id: string;
  user_name?: string; // For displaying who uploaded it
}

export interface LocationGroup {
  name: string;
  lat: number;
  lng: number;
  photos: PhotoEntry[];
}
