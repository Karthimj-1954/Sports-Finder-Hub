import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "react-hot-toast";

function Home() {
  const [stats, setStats] = useState({
    activePartners: 0,
    openRequests: 0,
    receivedRequests: 0,
    acceptedMatches: 0,
  });

  const [nearbyPartners, setNearbyPartners] = useState([]);
  const [openSessions, setOpenSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  useEffect(() => {
    // Get browser geolocation coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error or denied: ", error);
        }
      );
    }

    const loadDashboardData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        // Fetch all players to get counts and nearby partner listings
        const playersSnap = await getDocs(collection(db, "players"));
        const allPlayers = playersSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Fetch all open play requests
        const playRequestsSnap = await getDocs(
          query(collection(db, "playRequests"), where("status", "==", "Open"))
        );
        const allPlayRequests = playRequestsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Fetch received requests for the logged-in user
        const receivedSnap = await getDocs(
          query(collection(db, "requests"), where("receiverId", "==", uid))
        );
        const allReceived = receivedSnap.docs.map((docSnap) => docSnap.data());

        const activePartnersCount = allPlayers.length;
        const openSessionsCount = allPlayRequests.length;
        const receivedRequestsCount = allReceived.length;
        const acceptedMatchesCount = allReceived.filter(
          (req) => req.status === "Accepted"
        ).length;

        setStats({
          activePartners: activePartnersCount,
          openRequests: openSessionsCount,
          receivedRequests: receivedRequestsCount,
          acceptedMatches: acceptedMatchesCount,
        });

        // Set nearby partners (exclude current user, limit to 3)
        const candidates = allPlayers.filter((p) => p.ownerId !== uid);
        setNearbyPartners(candidates.slice(0, 3));

        // Set open session requests (exclude current user's, limit to 3)
        const sessions = allPlayRequests.filter((s) => s.creatorId !== uid);
        setOpenSessions(sessions.slice(0, 3));
      } catch (error) {
        console.error("Error loading dashboard data: ", error);
        toast.error("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userId]);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading sports hub dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 mb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
        <div className="relative z-10 max-w-xl">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight">
            Connect & Play with Local Players
          </h1>
          <p className="font-body text-base md:text-lg text-orange-100 mt-4 leading-relaxed">
            Find nearby sports partners, join open play sessions, and establish coordinates-based games in your community.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/partner"
              className="font-body font-semibold bg-white text-[#D35400] px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition duration-200 text-sm text-center"
            >
              🔍 Find Partners
            </Link>
            <Link
              to="/create"
              className="font-body font-semibold bg-orange-700/50 hover:bg-orange-700/80 text-white border border-orange-300/30 px-6 py-3 rounded-xl transition duration-200 text-sm text-center"
            >
              ➕ Host Session
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#FFF9F2]/80 border border-orange-100/50 p-6 rounded-2xl shadow-md text-center">
          <span className="text-2xl">👥</span>
          <h3 className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Active Partners</h3>
          <p className="font-heading text-3xl font-extrabold text-slate-800 mt-1">{stats.activePartners}</p>
        </div>

        <div className="bg-[#FFF9F2]/80 border border-orange-100/50 p-6 rounded-2xl shadow-md text-center">
          <span className="text-2xl">🎯</span>
          <h3 className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Open Sessions</h3>
          <p className="font-heading text-3xl font-extrabold text-slate-800 mt-1">{stats.openRequests}</p>
        </div>

        <div className="bg-[#FFF9F2]/80 border border-orange-100/50 p-6 rounded-2xl shadow-md text-center">
          <span className="text-2xl">📥</span>
          <h3 className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Received Requests</h3>
          <p className="font-heading text-3xl font-extrabold text-slate-800 mt-1">{stats.receivedRequests}</p>
        </div>

        <div className="bg-[#FFF9F2]/80 border border-orange-100/50 p-6 rounded-2xl shadow-md text-center">
          <span className="text-2xl">🤝</span>
          <h3 className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Accepted Matches</h3>
          <p className="font-heading text-3xl font-extrabold text-slate-800 mt-1">{stats.acceptedMatches}</p>
        </div>
      </div>

      {/* Sections Split */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* Nearby Partners */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-slate-800">Nearby Partners</h2>
            <Link to="/partner" className="font-body text-sm font-semibold text-orange-650 hover:underline">
              See All
            </Link>
          </div>

          {nearbyPartners.length === 0 ? (
            <div className="bg-[#FFF9F2]/50 border border-dashed border-orange-200 rounded-3xl p-8 text-center text-slate-400">
              <span className="text-3xl">🏃</span>
              <p className="font-body text-sm font-semibold mt-2">No nearby partners listed yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nearbyPartners.map((partner) => {
                const distance = userCoords && partner.latitude && partner.longitude
                  ? getDistance(userCoords.latitude, userCoords.longitude, partner.latitude, partner.longitude)
                  : null;

                return (
                  <div
                    key={partner.id}
                    className="bg-[#FFF9F2]/80 border border-orange-100/50 p-5 rounded-2xl shadow hover:shadow-md transition flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-heading text-lg font-bold text-slate-800 flex items-center gap-1.5">
                        {partner.name}
                        {partner.isVerified && (
                          <span className="text-green-600 bg-green-50 text-[9px] font-bold px-1.5 py-0.5 rounded border border-green-150 uppercase tracking-wide">
                            ✔ Verified
                          </span>
                        )}
                      </h4>
                      <p className="font-body text-sm text-slate-500 mt-1">
                        🎮 {partner.game || partner.sport} | ⭐ {partner.skill || partner.skillLevel}
                      </p>
                      <p className="font-body text-xs text-slate-455">
                        📍 {partner.location}
                      </p>
                      {distance !== null && (
                        <p className="font-body text-xs font-semibold text-orange-600 mt-1">
                          📏 {distance.toFixed(1)} km away
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/player/${partner.id}`}
                      className="font-body font-semibold bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-xl transition text-xs"
                    >
                      View Profile
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Open Play Sessions */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-slate-800">Open Play Sessions</h2>
            <Link to="/partner" className="font-body text-sm font-semibold text-orange-650 hover:underline">
              See All
            </Link>
          </div>

          {openSessions.length === 0 ? (
            <div className="bg-[#FFF9F2]/50 border border-dashed border-orange-200 rounded-3xl p-8 text-center text-slate-400">
              <span className="text-3xl">🎾</span>
              <p className="font-body text-sm font-semibold mt-2">No open sessions found near you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openSessions.map((session) => {
                const distance = userCoords && session.latitude && session.longitude
                  ? getDistance(userCoords.latitude, userCoords.longitude, session.latitude, session.longitude)
                  : null;

                return (
                  <div
                    key={session.id}
                    className="bg-[#FFF9F2]/80 border border-orange-100/50 p-5 rounded-2xl shadow hover:shadow-md transition flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-heading text-lg font-bold text-slate-800">{session.game}</h4>
                      <p className="font-body text-sm text-slate-500 mt-1">
                        🗓 {session.date} | ⏱ {session.time}
                      </p>
                      <p className="font-body text-xs text-slate-455">
                        📍 {session.location} ({session.locationType || "Local Court"})
                      </p>
                      {distance !== null && (
                        <p className="font-body text-xs font-semibold text-orange-600 mt-1">
                          📏 {distance.toFixed(1)} km away
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/match/${session.id}`}
                      className="font-body font-semibold bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl shadow transition text-xs"
                    >
                      Join Game
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;