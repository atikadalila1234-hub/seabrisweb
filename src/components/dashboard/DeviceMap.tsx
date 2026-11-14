import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Device } from '../../types';
import { getCapacityCategory } from '../../data/mockData';
import { Info, MapPin, ExternalLink, Activity } from 'lucide-react';

interface DeviceMapProps {
  devices: Device[];
  onSelectDevice: (deviceId: string) => void;
}

export const DeviceMap: React.FC<DeviceMapProps> = ({
  devices,
  onSelectDevice,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map on Teluk Jakarta coastal area: ~ [-6.11, 106.82]
    const centerLatLng: [number, number] = [-6.1100, 106.8200];

    // If map already exists, remove it before reinitializing
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: centerLatLng,
      zoom: 12,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add markers for all SEABRIS units
    devices.forEach((dev) => {
      const category = getCapacityCategory(dev.capacityPercentage);
      let pinColor = '#0077B6';
      let ringColor = 'rgba(0, 119, 182, 0.2)';

      if (dev.capacityPercentage >= 90) {
        pinColor = '#DC2626';
        ringColor = 'rgba(220, 38, 38, 0.3)';
      } else if (dev.capacityPercentage >= 80) {
        pinColor = '#D97706';
        ringColor = 'rgba(217, 119, 6, 0.3)';
      }

      // Custom DivIcon with SVG badge & capacity pulse
      const customIcon = L.divIcon({
        className: 'custom-jaksea-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              background: ${pinColor};
              color: white;
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              font-weight: 700;
              padding: 3px 6px;
              border-radius: 9999px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
              border: 2px solid white;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
            ">
              <span>${dev.code}</span>
              <span style="opacity: 0.9;">·</span>
              <span>${dev.capacityPercentage}%</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid ${pinColor};
              margin-top: -1px;
            "></div>
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 36],
        popupAnchor: [0, -32],
      });

      const marker = L.marker(dev.coordinates, { icon: customIcon }).addTo(map);

      // Custom rich popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-slate-800 text-xs min-w-[200px]';
      popupContent.innerHTML = `
        <div style="margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: 700; color: #023E8A;">${dev.code} · ${dev.name}</div>
          <div style="font-size: 10px; color: #64748B;">${dev.locationName}</div>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748B;">Kapasitas:</span>
            <strong style="color: ${pinColor}; font-family: monospace;">${dev.capacityPercentage}% (${category})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748B;">Daya Baterai:</span>
            <span style="font-family: monospace;">${dev.batteryLevel}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B;">Status:</span>
            <span style="color: #10B981; font-weight: 600;">Aktif Terhubung</span>
          </div>
        </div>
        <button id="btn-inspect-${dev.id}" style="
          width: 100%;
          background: #0077B6;
          color: white;
          border: none;
          padding: 6px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11px;
          cursor: pointer;
        ">
          Buka Monitoring Alat & Simulasi →
        </button>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${dev.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectDevice(dev.id);
          };
        }
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [devices, onSelectDevice]);

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border space-y-4">
      

      {/* Map Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Map Legend */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">Legenda Kapasitas:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0077B6]"></span>
              Normal (&lt;80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Hampir Penuh (80-89%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Penuh (≥90%)
            </span>
          </div>

          <span className="text-slate-500 font-mono">
            {devices.length} Unit Aktif di Peta
          </span>
        </div>

        {/* Map Viewport Container */}
        <div className="h-[480px] w-full relative z-0">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>

      {/* Quick Location Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {devices.map((dev) => (
          <div
            key={dev.id}
            onClick={() => onSelectDevice(dev.id)}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#0077B6] cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0077B6]" />
                <span className="font-bold text-xs text-slate-900">{dev.code}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                {dev.locationName}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-xs text-slate-900">
                {dev.capacityPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 block">Kapasitas</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
