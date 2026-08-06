import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoPoint, Driver } from '../types';

interface MapViewProps {
  restaurantLocation: GeoPoint;
  customerLocation: GeoPoint;
  driverLocation: GeoPoint;
  routeCoordinates: GeoPoint[];
  driver: Driver;
  mapTileStyle?: 'dark' | 'street';
}

export const MapView: React.FC<MapViewProps> = ({
  restaurantLocation,
  customerLocation,
  driverLocation,
  routeCoordinates,
  driver,
  mapTileStyle = 'dark',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not existing
    if (!mapInstanceRef.current) {
      const centerLat = (restaurantLocation.lat + customerLocation.lat) / 2;
      const centerLng = (restaurantLocation.lng + customerLocation.lng) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark theme CartoDB tile layer
      const tileUrl =
        mapTileStyle === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // 1. Restaurant Marker
      const restaurantIcon = L.divIcon({
        className: 'custom-restaurant-icon',
        html: `
          <div style="background: #e11d48; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(225,29,72,0.5);">
            🍔
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([restaurantLocation.lat, restaurantLocation.lng], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup(`<b>${restaurantLocation.address || 'FastBite Kitchen HQ'}</b>`);

      // 2. Customer Pin Marker
      const customerIcon = L.divIcon({
        className: 'custom-customer-icon',
        html: `
          <div style="background: #10b981; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(16,185,129,0.5);">
            📍
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>Delivery Address</b><br/>${customerLocation.address || 'Customer Location'}`);

      // 3. Route Polyline
      const latLngs = routeCoordinates.map((p) => [p.lat, p.lng] as [number, number]);
      const polyline = L.polyline(latLngs, {
        color: '#f97316', // Orange line
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      polylineRef.current = polyline;

      // 4. Driver Scooter Marker
      const driverIcon = L.divIcon({
        className: 'driver-marker-container',
        html: `
          <div class="driver-marker-pulse"></div>
          <div style="background: linear-gradient(135deg, #f97316, #f59e0b); width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; border: 3px solid #ffffff; box-shadow: 0 6px 16px rgba(249,115,22,0.6); z-index: 10;">
            🛵
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`<b>Courier: ${driver.name}</b><br/>Vehicle: ${driver.vehicleType} (${driver.vehiclePlate})`);

      driverMarkerRef.current = driverMarker;

      // Fit bounds to encompass route
      if (latLngs.length > 0) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up map on unmount if needed
    };
  }, []);

  // Update driver marker location in real-time as coordinates change
  useEffect(() => {
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
    }
  }, [driverLocation.lat, driverLocation.lng]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-zinc-800 shadow-inner custom-leaflet-map">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Overlay Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700/80 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>GPS Live Tracking</span>
      </div>
    </div>
  );
};
