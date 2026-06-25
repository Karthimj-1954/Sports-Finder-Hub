import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

function ClickMarker({ setLocation, markerPosition, setMarkerPosition }) {
    useMapEvents({
        async click(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            setMarkerPosition([lat, lng]);

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );

                const data = await response.json();

                setLocation(
                    data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                );
            } catch {
                setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        },
    });

    return markerPosition ? <Marker position={markerPosition} /> : null;
}

function LocationPicker({ location, setLocation }) {
    const [markerPosition, setMarkerPosition] = useState(null);

    return (
        <div className="mb-4">
            <h3 className="font-bold mb-2">Select Location on Map</h3>

            <MapContainer
                center={[8.5241, 76.9366]}
                zoom={12}
                style={{ height: "350px", width: "100%" }}
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ClickMarker
                    setLocation={setLocation}
                    markerPosition={markerPosition}
                    setMarkerPosition={setMarkerPosition}
                />
            </MapContainer>

            <input
                type="text"
                value={location}
                readOnly
                placeholder="Selected Location Name"
                className="border p-3 rounded w-full mt-3 bg-gray-100"
            />
        </div>
    );
}

export default LocationPicker;