import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

function Home() {
  const animations = [
    { sport: "Football", emoji: "⚽", text: "GOAL!" },
    { sport: "Cricket", emoji: "🏏", text: "SIXER!" },
    { sport: "Basketball", emoji: "🏀", text: "SWISH!" },
    { sport: "Badminton", emoji: "🏸", text: "SMASH!" },
    { sport: "Volleyball", emoji: "🏐", text: "SPIKE!" },
    { sport: "Tennis", emoji: "🎾", text: "ACE!" },
    { sport: "Chess", emoji: "♟️", text: "CHECKMATE!" },
    { sport: "Carrom", emoji: "🔴", text: "STRIKE!" },
    { sport: "Table Tennis", emoji: "🏓", text: "PING PONG!" },
    { sport: "Cards", emoji: "🃏", text: "ALL IN!" },
  ];

  // Initialize the welcomeSport state lazily to keep render pure and avoid useEffect warnings
  const [welcomeSport] = useState(() => {
    const randomIndex = Math.floor(Math.random() * animations.length);
    return animations[randomIndex];
  });

  const [players, setPlayers] = useState([]);
  const [playRequests, setPlayRequests] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [acceptedRequestsCount, setAcceptedRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch players
        const playersSnapshot = await getDocs(collection(db, "players"));
        const playersList = playersSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPlayers(playersList);

        // 2. Fetch playRequests
        const playRequestsSnapshot = await getDocs(collection(db, "playRequests"));
        const playRequestsList = playRequestsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPlayRequests(playRequestsList);

        // 3. Fetch requests for receiverId == userId
        if (userId) {
          const reqQuery = query(collection(db, "requests"), where("receiverId", "==", userId));
          const reqSnapshot = await getDocs(reqQuery);
          const myRequests = reqSnapshot.docs.map((docSnap) => docSnap.data());
          setRequestsCount(myRequests.length);

          const myAccepted = myRequests.filter((req) => req.status === "Accepted");
          setAcceptedRequestsCount(myAccepted.length);
        }
      } catch (error) {
        console.error("Error loading home dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const displayedPlayers = players.filter((player) => player.ownerId !== userId);
  const displayedPlayRequests = playRequests.filter((req) => req.status === "Open" && req.creatorId !== userId);

  const statCardClass =
    "bg-[#FFF9F2]/80 backdrop-blur-md border border-orange-100 text-slate-800 shadow-xl rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center text-center";

  const cardClass =
    "bg-[#FFF9F2]/90 backdrop-blur-sm border border-orange-100/50 text-slate-800 shadow-lg rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between";

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        Loading dashboard details...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-10 px-4">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-5xl font-bold tracking-tight text-[#8E2F00] sm:text-6xl drop-shadow-sm">
          Sports Finder Hub
        </h1>
        <p className="font-body text-base leading-relaxed text-[#A04000] font-medium mt-4 max-w-2xl mx-auto">
          Local Sports & Indoor Games Partner Finder Platform
        </p>
      </div>

      {/* Dynamic Animated Welcome Box */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#E65100] to-[#8E2F00] rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-12">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <span className="font-body font-semibold bg-orange-500/20 text-white text-xs uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
              Featured Game
            </span>
            <h2 className="font-heading text-3xl font-semibold mt-3 tracking-tight">
              Today&apos;s Matchup: {welcomeSport.sport}
            </h2>
            <p className="font-body text-base leading-relaxed text-orange-100 mt-2 max-w-md">
              Find partners, host sessions, and connect with other players in your neighborhood today.
            </p>
          </div>

          <div className="flex flex-col items-center bg-orange-500/10 backdrop-blur-md rounded-2xl p-6 min-w-[200px] border border-orange-500/20 shadow-lg">
            <div className="sport-animation mb-2 w-full flex items-center justify-center">
              <div className="moving-ball text-6xl select-none">{welcomeSport.emoji}</div>
            </div>
            <h3 className="animation-text font-heading font-bold text-2xl tracking-widest text-yellow-300 drop-shadow-sm uppercase">
              {welcomeSport.text}
            </h3>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className={statCardClass}>
          <div className="p-3 bg-orange-50 text-[#ff6d00] rounded-full text-2xl mb-3 font-semibold">👥</div>
          <h3 className="font-heading text-4xl font-bold text-[#ff6d00]">{players.length}</h3>
          <p className="font-body text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Total Players</p>
        </div>

        <div className={statCardClass}>
          <div className="p-3 bg-orange-50/80 text-[#D35400] rounded-full text-2xl mb-3 font-semibold">🏸</div>
          <h3 className="font-heading text-4xl font-bold text-[#D35400]">{playRequests.filter(r => r.status === "Open").length}</h3>
          <p className="font-body text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Open Play Requests</p>
        </div>

        <div className={statCardClass}>
          <div className="p-3 bg-orange-100/60 text-[#8E2F00] rounded-full text-2xl mb-3 font-semibold">📩</div>
          <h3 className="font-heading text-4xl font-bold text-[#8E2F00]">{requestsCount}</h3>
          <p className="font-body text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Total Requests</p>
        </div>

        <div className={statCardClass}>
          <div className="p-3 bg-orange-100/80 text-[#A04000] rounded-full text-2xl mb-3 font-semibold">✅</div>
          <h3 className="font-heading text-4xl font-bold text-[#A04000]">{acceptedRequestsCount}</h3>
          <p className="font-body text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Accepted Requests</p>
        </div>
      </div>

      {/* Nearby Game Partners Section */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-3xl font-semibold text-slate-800 tracking-tight">
            Nearby Game Partners
          </h2>
          <Link
            to="/partner"
            className="font-body font-semibold text-sm text-[#E65100] hover:text-[#D35400] bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition"
          >
            Find More &rarr;
          </Link>
        </div>

        {displayedPlayers.length === 0 ? (
          <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-2xl p-10 text-center shadow">
            <p className="font-body text-base leading-relaxed text-slate-500">No player profiles registered yet.</p>
            <Link
              to="/profile"
              className="font-body font-semibold mt-4 inline-block bg-[#E65100] hover:bg-[#D35400] text-white px-6 py-2.5 rounded-xl shadow-md transition"
            >
              Create My Profile
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {displayedPlayers.slice(0, 6).map((player) => (
              <div key={player.id} className={cardClass}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-slate-800 truncate">
                      {player.name}
                    </h3>
                    <span className="font-body font-semibold bg-orange-50 text-[#E65100] text-xs px-2.5 py-1 rounded-full uppercase tracking-wider border border-orange-100">
                      {player.skill}
                    </span>
                  </div>

                  <div className="font-body text-base leading-relaxed space-y-2 text-slate-600">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">🎮</span>
                      <strong className="text-slate-700 font-semibold">Game:</strong> {player.game || player.sport}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">📍</span>
                      <strong className="text-slate-700 font-semibold">Location:</strong> {player.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">🏠</span>
                      <strong className="text-slate-700 font-semibold">Place:</strong> {player.locationType || "Local Court"}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">🗓</span>
                      <strong className="text-slate-700 font-semibold">Days:</strong> {player.availabilityDay}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">⏰</span>
                      <strong className="text-slate-700 font-semibold">Time:</strong> {player.availabilityTime}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/player/${player.id}`}
                    className="font-body font-semibold w-full text-center bg-[#E65100] hover:bg-[#D35400] text-white py-2.5 px-4 rounded-xl shadow-md transition duration-200"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Play Requests Section */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-3xl font-semibold text-slate-800 tracking-tight">
            Open Play Requests
          </h2>
          <Link
            to="/create"
            className="font-body font-semibold text-sm text-[#8E2F00] hover:text-[#7A2800] bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition"
          >
            Create Request &rarr;
          </Link>
        </div>

        {displayedPlayRequests.length === 0 ? (
          <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-2xl p-10 text-center shadow">
            <p className="font-body text-base leading-relaxed text-slate-500">No play requests created yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {displayedPlayRequests.map((request) => (
              <div key={request.id} className={cardClass}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-slate-800 truncate">
                      {request.game}
                    </h3>
                    <span className={`font-body font-semibold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      request.status === "Open" 
                        ? "bg-green-50 text-green-700 border-green-100" 
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="font-body text-base leading-relaxed space-y-2 text-slate-600">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">📍</span>
                      <strong className="text-slate-700 font-semibold">Location:</strong> {request.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">🏠</span>
                      <strong className="text-slate-700 font-semibold">Place:</strong> {request.locationType}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">📅</span>
                      <strong className="text-slate-700 font-semibold">Date:</strong> {request.date}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">⏰</span>
                      <strong className="text-slate-700 font-semibold">Time:</strong> {request.time}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">👥</span>
                      <strong className="text-slate-700 font-semibold">Players Needed:</strong> {request.playersNeeded}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-5 text-center">⭐</span>
                      <strong className="text-slate-700 font-semibold">Skill Level:</strong> {request.skill}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    to={`/match/${request.id}`}
                    className="font-body font-semibold w-full block text-center bg-[#8E2F00] hover:bg-[#7A2800] text-white py-2.5 px-4 rounded-xl shadow-md transition duration-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;