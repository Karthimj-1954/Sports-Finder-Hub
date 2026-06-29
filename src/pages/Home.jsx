import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
};

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

  const [players, setPlayers] = useState([]);
  const userId = auth.currentUser?.uid;

  console.log("Home loaded players:", players);
  console.log("Current user:", auth.currentUser?.uid);

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

    let unsubscribePlayers = null;
    let unsubscribePlayReq = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribePlayers) unsubscribePlayers();
      if (unsubscribePlayReq) unsubscribePlayReq();

      if (!user) {
        setLoading(false);
        return;
      }

      const uid = user.uid;
      let playersLoaded = false;
      let requestsLoaded = false;
      let playRequestsLoaded = false;

      const checkLoadingFinished = () => {
        if (playersLoaded && requestsLoaded && playRequestsLoaded) {
          setLoading(false);
        }
      };

      // Real-time listener for players
      unsubscribePlayers = onSnapshot(collection(db, "players"), (playersSnap) => {
        const allPlayers = playersSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPlayers(allPlayers);
        
        setNearbyPartners(allPlayers.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          activePartners: allPlayers.length,
        }));
        playersLoaded = true;
        checkLoadingFinished();
      }, (err) => {
        console.error("Error listening to players: ", err);
        playersLoaded = true;
        checkLoadingFinished();
      });

      // Load requests
      getDocs(query(collection(db, "requests"), where("receiverId", "==", uid)))
        .then((receivedSnap) => {
          const allReceived = receivedSnap.docs.map((docSnap) => docSnap.data());
          setStats((prev) => ({
            ...prev,
            receivedRequests: allReceived.length,
            acceptedMatches: allReceived.filter((req) => req.status === "Accepted").length,
          }));
          requestsLoaded = true;
          checkLoadingFinished();
        })
        .catch((err) => {
          console.error("Error fetching requests: ", err);
          requestsLoaded = true;
          checkLoadingFinished();
        });

      // Real-time listener for playRequests
      const q = query(collection(db, "playRequests"), where("status", "==", "Open"));
      unsubscribePlayReq = onSnapshot(q, (snapshot) => {
        const sessionsList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setOpenSessions(sessionsList.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          openRequests: sessionsList.length,
        }));
        playRequestsLoaded = true;
        checkLoadingFinished();
      }, (error) => {
        console.error("Error listing playRequests: ", error);
        playRequestsLoaded = true;
        checkLoadingFinished();
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePlayers) unsubscribePlayers();
      if (unsubscribePlayReq) unsubscribePlayReq();
    };
  }, [userId]);

  const handleDeleteSession = async (session) => {
    if (!window.confirm("Are you sure you want to delete this play session?")) {
      return;
    }

    const loadingToast = toast.loading("Deleting play session...");
    try {
      await deleteDoc(doc(db, "playRequests", session.id));
      // Proactively update local state for immediate feedback
      setOpenSessions((prev) => prev.filter((item) => item.id !== session.id));
      toast.dismiss(loadingToast);
      toast.success("Play session deleted successfully.");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error deleting session: ", error);
      toast.error("Failed to delete session.");
    }
  };

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
    return <LoadingSpinner text="Loading Sports Finder Hub..." />;
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 mb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[30%] w-[200px] h-[200px] rounded-full bg-amber-500/20 blur-xl pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          {/* Left content (unchanged) */}
          <div className="lg:col-span-7 max-w-xl">
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

          {/* Right content (new animated right-side illustration) */}
          <div className="lg:col-span-5 relative w-full flex flex-col sm:flex-row gap-6 items-center justify-center min-h-[320px] mt-6 lg:mt-0">
            {/* Inline CSS animations */}
            <style>{`
              @keyframes float-y-1 {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-12px) scale(1.02); }
              }
              @keyframes float-y-2 {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(12px) scale(0.98); }
              }
              @keyframes float-random-1 {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                33% { transform: translate(6px, -8px) rotate(8deg); }
                66% { transform: translate(-4px, 4px) rotate(-6deg); }
              }
              @keyframes float-random-2 {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                50% { transform: translate(-8px, -12px) rotate(-12deg); }
              }
              @keyframes float-random-3 {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                50% { transform: translate(10px, 8px) rotate(15deg); }
              }
              @keyframes swim-stroke {
                0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
                50% { transform: translate(12px, -6px) rotate(-10deg) scale(1.05); }
              }
              .animate-card-1 {
                animation: float-y-1 6s ease-in-out infinite;
              }
              .animate-card-2 {
                animation: float-y-2 7s ease-in-out infinite;
              }
              .animate-elem-1 {
                animation: float-random-1 8s ease-in-out infinite;
              }
              .animate-elem-2 {
                animation: float-random-2 9s ease-in-out infinite;
              }
              .animate-elem-3 {
                animation: float-random-3 10s ease-in-out infinite;
              }
              .animate-swim {
                animation: swim-stroke 5s ease-in-out infinite;
              }
            `}</style>

            {/* Floating Sports Elements */}
            <div className="absolute top-2 left-6 text-3xl animate-elem-1 opacity-80 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">⚽</div>
            <div className="absolute bottom-6 right-8 text-4xl animate-elem-2 opacity-80 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">🏸</div>
            <div className="absolute top-1/2 left-[42%] text-3xl animate-elem-3 opacity-90 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">♟️</div>
            <div className="absolute top-10 right-4 text-2xl animate-elem-1 opacity-70 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">🏀</div>
            <div className="absolute bottom-[20%] left-[-20px] text-4xl animate-swim opacity-95 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]">🏊</div>
            <div className="absolute top-[20%] right-[30%] text-3xl animate-elem-1 opacity-75 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">🌊</div>

            {/* Indoor Games Card */}
            <div className="animate-card-1 w-full sm:w-[200px] bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 shadow-2xl hover:bg-white/15 hover:scale-105 hover:border-white/30 transition-all duration-300 cursor-pointer">
              <span className="text-2xl mb-2 block">🏠</span>
              <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-orange-50 mb-4">
                Indoor Games
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: "♟️", name: "Chess" },
                  { icon: "🔴", name: "Carrom" },
                  { icon: "🏓", name: "Table Tennis" },
                  { icon: "🏸", name: "Badminton" },
                  { icon: "🃏", name: "Cards" },
                ].map((game, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-white/90 shadow-md border border-orange-100 flex items-center justify-center text-lg hover:scale-110 hover:-rotate-12 transition-transform duration-250"
                    title={game.name}
                  >
                    {game.icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Outdoor Games Card */}
            <div className="animate-card-2 w-full sm:w-[200px] bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 shadow-2xl hover:bg-white/15 hover:scale-105 hover:border-white/30 transition-all duration-300 cursor-pointer mt-6 sm:mt-12">
              <span className="text-2xl mb-2 block">🌳</span>
              <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-orange-50 mb-4">
                Outdoor Games
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: "⚽", name: "Football" },
                  { icon: "🏏", name: "Cricket" },
                  { icon: "🏀", name: "Basketball" },
                  { icon: "🎾", name: "Tennis" },
                  { icon: "🏐", name: "Volleyball" },
                  { icon: "🏊", name: "Swimming" },
                ].map((game, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-white/90 shadow-md border border-orange-100 flex items-center justify-center text-lg hover:scale-110 hover:-rotate-12 transition-transform duration-250"
                    title={game.name}
                  >
                    {game.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#FFF9F2]/80 border border-orange-100/50 p-6 rounded-2xl shadow-md text-center">
          <span className="text-2xl">👥</span>
          <h3 className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Active Partners</h3>
          <p className="font-heading text-3xl font-extrabold text-slate-800 mt-1">{players.length}</p>
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

          {players.length === 0 ? (
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

                const playerSport = partner.sport || partner.game || "Not specified";

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
                        🎮 Game: {playerSport} | ⭐ {partner.skill || partner.skillLevel}
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
                        🗓 {formatDate(session.date)} | ⏱ {session.time}
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
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/match/${session.id}`}
                        className="font-body font-semibold bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl shadow transition text-xs"
                      >
                        Join Game
                      </Link>
                      {session.creatorId === auth.currentUser?.uid && (
                        <button
                          onClick={() => handleDeleteSession(session)}
                          className="font-body font-semibold border border-red-600 hover:bg-red-50 text-red-600 px-3 py-2 rounded-xl transition text-xs flex items-center gap-1 cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
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