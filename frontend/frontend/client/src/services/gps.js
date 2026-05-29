import { apiFetch } from './apiFetch';

export const updateGpsLocation = (coordinates, accuracy) =>
  apiFetch('/users/gps/update', {
    method: 'POST',
    body: JSON.stringify({ coordinates, accuracy }),
  });

export const getLocationHistory = () => apiFetch('/users/gps/history');

export const getNearbyUsers = (maxDistance = 5000) =>
  apiFetch(`/users/gps/nearby?maxDistance=${maxDistance}`);

export const getNearbyTrips = (longitude, latitude, maxDistance = 50000) =>
  apiFetch(
    `/trips/search/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`
  );
