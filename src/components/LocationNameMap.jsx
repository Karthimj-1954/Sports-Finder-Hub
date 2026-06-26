import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Setup Leaflet icon to solve default icon resolution issues
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationNameMap({ locationName }) {
  const [debouncedLocation, setDebouncedLocation] = useState(locationName || "");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce the locationName input changes by 700ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(locationName || "");
    }, 700);

    return () => {
      clearTimeout(handler);
    };
  }, [locationName]);

  // Geocode location Name to coordinates
  useEffect(() => {
    const trimmed = debouncedLocation.trim();
    if (!trimmed) {
      const t = setTimeout(() => {
        setCoords(null);
        setError(null);
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCoords([lat, lon]);
        } else {
          setCoords(null);
          setError("Location not found. Please enter a more specific place.");
        }
        setLoading(false);
      })
      .catch(() => {
        setCoords(null);
        setError("Location not found. Please enter a more specific place.");
        setLoading(false);
      });

    return () => clearTimeout(t);
  }, [debouncedLocation]);

  const mapComponent = useMemo(() => {
    if (loading) {
      return (
        <div className="font-body text-sm text-[#8E2F00] font-semibold animate-pulse flex flex-col items-center gap-2">
          <span className="text-2xl animate-spin">🔄</span>
          Locating...
        </div>
      );
    }

    if (!locationName || !locationName.trim()) {
      return (
        <div className="font-body text-sm text-slate-400 font-semibold flex flex-col items-center gap-2">
          <span className="text-3xl">📍</span>
          Enter a location to preview map.
        </div>
      );
    }

    if (error) {
      return (
        <div className="font-body text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4 max-w-xs font-semibold flex flex-col items-center gap-2 text-center">
          <span className="text-2xl">⚠️</span>
          {error}
        </div>
      );
    }

    if (coords) {
      return (
        <MapContainer
          center={coords}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={coords} icon={DefaultIcon}>
            <Popup>
              <div className="font-heading font-semibold text-slate-800 text-sm">{locationName}</div>
            </Popup>
          </Marker>
        </MapContainer>
      );
    }

    return null;
  }, [loading, locationName, error, coords]);

  return (
    <div className="w-full mt-2">
      <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-orange-100/50 shadow-md relative bg-[#FFFDFB] flex items-center justify-center p-1">
        {mapComponent}
      </div>
    </div>
  );
}

export default LocationNameMap;
