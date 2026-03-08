import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Shield, Building2, AlertTriangle, TrendingUp, Users, X, Layers } from 'lucide-react';
import { getScoreBadgeClass } from '@/lib/mockData';
import type { DistrictScore } from '@/lib/mockData';
import { useMode } from '@/lib/modeContext';
import 'leaflet/dist/leaflet.css';

// Montgomery, AL district approximate coordinates
const districtCoords: Record<number, [number, number]> = {
  1: [32.3792, -86.3077],  // Downtown Core
  2: [32.3730, -86.2850],  // Capitol Heights
  3: [32.3600, -86.3050],  // Cloverdale-Idlewild
  4: [32.4000, -86.2900],  // Dalraida
  5: [32.3750, -86.3400],  // Chisholm
  6: [32.3620, -86.2500],  // Governors Square
  7: [32.3350, -86.2400],  // Pike Road Corridor
  8: [32.3850, -86.3500],  // West Boulevard
  9: [32.3400, -86.2700],  // McGehee Estates
};

const riskRadius = (pressure: string) => {
  if (pressure === 'HIGH' || pressure === 'RISING') return 28;
  if (pressure === 'MEDIUM') return 22;
  return 16;
};

const riskColor = (pressure: string) => {
  if (pressure === 'HIGH' || pressure === 'RISING') return '#ef4444';
  if (pressure === 'MEDIUM') return '#f59e0b';
  return '#22c55e';
};

const riskFill = (pressure: string) => {
  if (pressure === 'HIGH' || pressure === 'RISING') return 'rgba(239, 68, 68, 0.25)';
  if (pressure === 'MEDIUM') return 'rgba(245, 158, 11, 0.2)';
  return 'rgba(34, 197, 94, 0.15)';
};

const signalIcon: Record<string, React.ElementType> = {
  Safety: Shield,
  Infrastructure: Building2,
  Emergency: AlertTriangle,
  Economy: TrendingUp,
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

interface CityHeatmapProps {
  districts?: DistrictScore[];
}

export function CityHeatmap({ districts }: CityHeatmapProps) {
  const { isLeadership } = useMode();
  const [selected, setSelected] = useState<number | null>(null);
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite'>('dark');

  if (!districts?.length) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Geospatial Intelligence</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Loading district data…</div>
      </div>
    );
  }

  const selectedDistrict = selected !== null ? districts.find(d => d.district === selected) : null;
  const center: [number, number] = [32.3668, -86.3000];

  const tileUrl = mapLayer === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  const tileAttribution = mapLayer === 'dark'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; Esri';

  return (
    <div className="glass-card overflow-hidden relative">
      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-background/90 via-background/60 to-transparent p-4 pb-8 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isLeadership ? 'Geospatial Intelligence' : 'City Conditions Map'}
            </h3>
            <p className="text-[11px] text-muted-foreground">Montgomery, AL — Real-time district overlay</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Layer toggle */}
            <button
              onClick={() => setMapLayer(l => l === 'dark' ? 'satellite' : 'dark')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/80 border border-border/50 text-[10px] font-medium text-foreground hover:bg-secondary transition-colors backdrop-blur-sm"
            >
              <Layers className="h-3 w-3" />
              {mapLayer === 'dark' ? 'Satellite' : 'Dark'}
            </button>
          </div>
        </div>
      </div>

      {/* Legend overlay — bottom left */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-md border border-border/40">
        {[
          { color: 'bg-rose-500/60', label: 'High Risk' },
          { color: 'bg-amber-500/50', label: 'Medium' },
          { color: 'bg-emerald-500/50', label: 'Low Risk' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Stats overlay — bottom right */}
      <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-md border border-border/40">
        <Users className="h-3 w-3 text-primary" />
        <span className="text-[10px] text-muted-foreground">
          {districts.reduce((sum, d) => sum + d.population, 0).toLocaleString()} total pop.
        </span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <span className="text-[10px] text-muted-foreground">{districts.length} districts</span>
      </div>

      {/* Selected district detail panel */}
      <AnimatePresence>
        {selectedDistrict && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-3 z-[1000] w-64 rounded-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden"
          >
            {/* District header */}
            <div
              className="px-4 py-3 border-b border-border/30"
              style={{
                background: `linear-gradient(135deg, ${riskFill(selectedDistrict.publicSafetyPressure)}, transparent)`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-primary tracking-wider uppercase">District {selectedDistrict.district}</span>
                  <h4 className="text-sm font-semibold text-foreground">{selectedDistrict.name}</h4>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-md hover:bg-secondary/80 text-muted-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {selectedDistrict.area} · Pop. {selectedDistrict.population.toLocaleString()}
              </p>
            </div>

            {/* Signals */}
            <div className="p-3 space-y-2">
              {[
                { label: 'Safety', value: selectedDistrict.publicSafetyPressure },
                { label: 'Infrastructure', value: selectedDistrict.infrastructureStress },
                { label: 'Emergency', value: selectedDistrict.emergencyDemand },
                { label: 'Economy', value: selectedDistrict.economicActivity },
              ].map(s => {
                const Icon = signalIcon[s.label] || Shield;
                return (
                  <div key={s.label} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    </div>
                    <span className={getScoreBadgeClass(s.value)}>{s.value}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Map */}
      <div className="h-[520px] lg:h-[620px] w-full">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
          style={{ background: 'hsl(var(--background))' }}
        >
          <TileLayer url={tileUrl} attribution={tileAttribution} />

          {districts.map((d) => {
            const coords = districtCoords[d.district];
            if (!coords) return null;
            const isSelected = selected === d.district;

            return (
              <CircleMarker
                key={d.district}
                center={coords}
                radius={riskRadius(d.publicSafetyPressure)}
                pathOptions={{
                  color: riskColor(d.publicSafetyPressure),
                  fillColor: riskFill(d.publicSafetyPressure),
                  fillOpacity: isSelected ? 0.6 : 0.4,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => setSelected(selected === d.district ? null : d.district),
                }}
              >
                <Popup className="district-popup">
                  <div className="text-xs">
                    <strong>D{d.district}: {d.name}</strong>
                    <br />
                    <span className="text-muted-foreground">{d.area}</span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
