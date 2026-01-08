"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function Map() {
  const [busLocations, setBusLocations] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  // Optimized Custom Marker UI
  const createBusIcon = (busNo: string) => {
    return L.divIcon({
      className: "custom-bus-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            background-color: #1e293b;
            color: #f8fafc;
            padding: 4px 12px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 13px;
            border: 2px solid #3b82f6;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            white-space: nowrap;
            font-family: sans-serif;
            letter-spacing: 0.5px;
          ">
            ${busNo}
          </div>
          <div style="
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #3b82f6;
            margin-top: -1px;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  };

  // Fetch bus locations from Supabase
  const fetchLocations = async () => {
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
  };

  // Ensure component renders only on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    if (!isClient) return;

    // Initial fetch
    fetchLocations();

    // Setup Real-time subscription
    const channel = supabase
      .channel('realtime_bus_map')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'bus_locations' }, 
        () => {
          fetchLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isClient]);

  // Prevent rendering on server
  if (!isClient) {
    return <div className="h-full w-full bg-slate-200 animate-pulse" />;
  }

  return (
    <div className="h-full w-full">
      <MapContainer 
        ref={mapInstanceRef}
        center={[23.8759, 90.3795]} 
        zoom={16} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {busLocations.map((loc) => (
          <Marker 
            key={`${loc.latitude}-${loc.longitude}-${loc.buses.bus_no}`}
            position={[loc.latitude, loc.longitude]} 
            icon={createBusIcon(loc.buses.bus_no)}
          >
            <Popup className="bus-popup">
              <div className="p-1">
                <p className="text-blue-600 font-black text-sm uppercase m-0">{loc.buses.bus_no}</p>
                <p className="text-slate-500 text-xs font-semibold m-0">{loc.buses.route_name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-700">{loc.speed} km/h</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}