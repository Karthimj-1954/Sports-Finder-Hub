import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";

// We import L to fix the Leaflet default marker icon issue
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mapCoords, setMapCoords] = useState([8.5241, 76.9366]); // Default center
  const [loadingMap, setLoadingMap] = useState(false);
  const [hasCoords, setHasCoords] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const docRef = doc(db, "playRequests", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const matchData = { id: docSnap.id, ...docSnap.data() };
          setMatch(matchData);
          if (matchData.location) {
            setLoadingMap(true);
          }
        }
      } catch (error) {
        console.error("Error fetching match: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  useEffect(() => {
    if (match && match.location) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(match.location)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setMapCoords([lat, lon]);
            setHasCoords(true);
          }
          setLoadingMap(false);
        })
        .catch(() => {
          setLoadingMap(false);
        });
    }
  }, [match]);

  const handleJoinRequest = async () => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid) {
      alert("Please login to send join requests");
      return;
    }

    if (match.creatorId === uid) {
      alert("You cannot join your own session request.");
      return;
    }

    try {
      // Determine joining player name from profiles
      let playerName = "Anonymous Player";
      const q = query(collection(db, "players"), where("ownerId", "==", uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        playerName = querySnapshot.docs[0].data().name || playerName;
      }

      // Add to requests list in Firestore
      const newRequest = {
        senderId: uid,
        senderEmail: email || "",
        receiverId: match.creatorId || "",
        receiverEmail: match.creatorEmail || "",
        playerName: playerName,
        game: match.game,
        skill: match.skill,
        location: match.location,
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "requests"), newRequest);
      
      alert(`Successfully sent request to join this ${match.game} session!`);
      navigate("/notifications");
    } catch (error) {
      console.error("Error joining match: ", error);
      alert("Failed to join session: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        Loading session details...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-5xl mx-auto mt-10 px-4 mb-20">
        <div className="mb-6">
          <Link to="/" className="font-body font-semibold text-sm text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg transition text-center">
            &larr; Back to Home
          </Link>
        </div>
        <div className="max-w-xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center">
          <h1 className="font-heading text-2xl font-bold text-slate-800">Match Request Not Found</h1>
          <p className="font-body text-base leading-relaxed text-slate-500 mt-2">The play request you are looking for does not exist or has been removed.</p>
          <Link to="/" className="font-body font-semibold mt-6 inline-block bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-6 rounded-xl transition text-sm text-center">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 mb-20">
      <div className="mb-6">
        <Link to="/" className="font-body font-semibold text-sm text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg transition text-center">
          &larr; Back to Home
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Match Info Details Card */}
        <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-8 rounded-3xl shadow-2xl text-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-body font-semibold bg-orange-50 text-orange-700 text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-orange-100">
                {match.skill} Preferred
              </span>
              <span className={`font-body font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider border ${
                match.status === "Open" 
                  ? "bg-green-50 text-green-700 border-green-100" 
                  : "bg-red-50 text-red-700 border-red-100"
              }`}>
                {match.status}
              </span>
            </div>

            <h1 className="font-heading text-4xl font-bold text-slate-800 tracking-tight mb-2">
              {match.game} Session
            </h1>
            <p className="font-body text-sm text-slate-500 mb-6">
              Match organized on {match.date} at {match.time}
            </p>

            <hr className="border-orange-100/30 my-6" />

            <div className="font-body text-base leading-relaxed space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl bg-orange-50 p-2.5 rounded-xl text-orange-600">📍</span>
                <div>
                  <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</p>
                  <p className="text-slate-700 font-semibold">{match.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl bg-orange-50 p-2.5 rounded-xl text-orange-600">🏠</span>
                <div>
                  <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Place Type</p>
                  <p className="text-slate-700 font-semibold">{match.locationType}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl bg-orange-50 p-2.5 rounded-xl text-orange-600">🗓️</span>
                <div>
                  <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</p>
                  <p className="text-slate-700 font-semibold">{match.date} @ {match.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl bg-orange-50 p-2.5 rounded-xl text-orange-600">👥</span>
                <div>
                  <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Players Needed</p>
                  <p className="text-slate-700 font-semibold">{match.playersNeeded} player(s)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-orange-100/30">
            {match.status === "Open" ? (
              <button
                onClick={handleJoinRequest}
                className="font-body font-semibold w-full bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-200 text-center"
              >
                Request to Join Session
              </button>
            ) : (
              <button
                disabled
                className="font-body font-semibold w-full bg-slate-100 text-slate-400 py-4 px-6 rounded-2xl cursor-not-allowed text-center"
              >
                Session Closed
              </button>
            )}
          </div>
        </div>

        {/* Right: Leaflet Map Viewer */}
        <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-6 rounded-3xl shadow-2xl text-slate-800 flex flex-col min-h-[400px]">
          <h3 className="font-heading text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>🗺️</span> Playing Location Map
          </h3>
          
          <div className="flex-1 rounded-2xl overflow-hidden border border-orange-100/50 shadow-inner relative">
            {loadingMap ? (
              <div className="font-body text-sm absolute inset-0 flex items-center justify-center bg-orange-50/20 text-slate-500 font-medium">
                Loading Map location...
              </div>
            ) : (
              <MapContainer
                center={mapCoords}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapCoords} icon={DefaultIcon}>
                  <Popup>
                    <div className="font-heading font-semibold text-slate-800">{match.game} Session</div>
                    <div className="font-body text-xs text-slate-500 mt-1">{match.location}</div>
                  </Popup>
                </Marker>
              </MapContainer>
            )}
          </div>
          
          {!hasCoords && !loadingMap && (
            <p className="font-body text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 font-semibold text-center">
              ⚠️ Could not geocode the exact street address. Map is showing regional default center.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchDetails;