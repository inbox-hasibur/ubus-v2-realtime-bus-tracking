"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvent, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

export default function Map() {
  const [busLocations, setBusLocations] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  // Memoized function to get user location and center map
  const trackMe = useCallback(() => {
    if (!navigator.geolocation) {
      window.dispatchEvent(new CustomEvent('user-location', { detail: null }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Fly to user location if map instance exists
        if (mapInstanceRef.current && typeof mapInstanceRef.current.flyTo === 'function') {
          try {
            mapInstanceRef.current.flyTo([latitude, longitude], 16, {
              animate: true,
              duration: 1.5,
            });
          } catch (err) {
            console.warn('FlyTo failed', err);
          }
        }

        window.dispatchEvent(new CustomEvent('user-location', { detail: { latitude, longitude } }));
      },
      () => {
        window.dispatchEvent(new CustomEvent('user-location', { detail: null }));
      }
    );
  }, []);

  // Memoized function to create bus icon with HTML template
  const createBusIcon = useCallback((busNo: string) => {
    // Format bus number to show only last two digits (prefer digits from string)
    const digits = (busNo || "").toString().replace(/\D+/g, "");
    const display = digits ? digits.slice(-2) : (busNo || "").toString().slice(-2);

    return L.divIcon({
      className: "custom-bus-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div class="bus-marker-badge">
            ${display}
          </div>
          <div class="bus-marker-pointer"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bus_locations')
        .select(`
          latitude, 
          longitude, 
          speed,
          buses (bus_no, route_name)
        `);

      if (error) throw error;
      if (data) setBusLocations(data);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    fetchLocations();

    // Add event listener for 'track-user' event
    window.addEventListener('track-user', trackMe);

    const channel = supabase
      .channel('realtime_bus_map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_locations' }, () => {
          fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Remove event listener on cleanup
      window.removeEventListener('track-user', trackMe);
    };
  }, [isClient, trackMe, fetchLocations]);

  // Memoized markers to prevent unnecessary re-renders
  const markers = useMemo(() => busLocations.slice(0, 3).map((loc, index) => (
    <Marker 
      key={`${loc.latitude}-${loc.longitude}-${index}`}
      position={[loc.latitude, loc.longitude]} 
      icon={createBusIcon(loc.buses?.bus_no || 'BUS')}
    >
      <Popup className="bus-popup">
        <div className="p-1">
          <p className="text-blue-600 font-black text-sm uppercase m-0">{loc.buses?.bus_no}</p>
          <p className="text-slate-500 text-xs font-semibold m-0">{loc.buses?.route_name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-700">{loc.speed} km/h</span>
          </div>
        </div>
      </Popup>
    </Marker>
  )), [busLocations, createBusIcon]);

  if (!isClient) {
    return <div className="h-full w-full bg-slate-200 animate-pulse" />;
  }

  // Helper component to capture map instance inside MapContainer
  const MapInstanceHelper = () => {
    const map = useRef<any>(null);
    const mapContext = useMapEvent('load', () => {
      if (mapContext) {
        mapInstanceRef.current = mapContext;
      }
    });
    
    // Alternative: use useMap hook if available
    try {
      const mapInstance = useMap?.();
      if (mapInstance && !mapInstanceRef.current) {
        mapInstanceRef.current = mapInstance;
      }
    } catch (err) {
      // useMap might not be available, use mapContext instead
    }

    return null;
  };

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[23.8759, 90.3795]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapInstanceHelper />
        {markers}
      </MapContainer>
    </div>
  );
}