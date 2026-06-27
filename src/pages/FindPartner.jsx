import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { games, skillLevels } from "../data/games";
import LocationNameMap from "../components/LocationNameMap";
import { auth, db } from "../firebase";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES_OF_DAY = ["Morning", "Afternoon", "Evening", "Night"];

function FindPartner() {
  const [game, setGame] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [searchName, setSearchName] = useState("");
  const [availDay, setAvailDay] = useState("");
  const [availTime, setAvailTime] = useState("");

  const [players, setPlayers] = useState([]);
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

    const fetchPlayers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "players"));
        const playersList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPlayers(playersList);
      } catch (error) {
        console.error("Error fetching players: ", error);
        toast.error("Failed to load players.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

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

  const filteredPlayers = players.filter((player) => {
    const matchGame =
      game === "" || player.game === game || player.sport === game;

    const matchSkill =
      skill === "" || player.skill === skill || player.skillLevel === skill;

    const matchLocation =
      location === "" ||
      player.location
        ?.toLowerCase()
        .includes(location.toLowerCase());

    const matchName =
      searchName === "" ||
      player.name
        ?.toLowerCase()
        .includes(searchName.toLowerCase());

    const matchDay =
      availDay === "" ||
      player.availabilityDays?.includes(availDay) ||
      player.availabilityDay?.toLowerCase().includes(availDay.toLowerCase());

    const matchTime =
      availTime === "" ||
      player.availabilityPeriod === availTime ||
      player.availabilityTimes?.includes(availTime) ||
      player.availabilityTime?.includes(availTime) ||
      player.availabilityTimeStr?.toLowerCase().includes(availTime.toLowerCase());

    return matchGame && matchSkill && matchLocation && matchName && matchDay && matchTime;
  });

  const sendRequest = async (player) => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid) {
      toast.error("Please login to send play requests");
      return;
    }

    if (player.ownerId === uid) {
      toast.error("You cannot send a play request to yourself.");
      return;
    }

    const newRequest = {
      senderId: uid,
      senderEmail: email || "",
      receiverId: player.ownerId || "",
      receiverEmail: player.ownerEmail || "",
      playerName: player.name || "",
      game: player.game || player.sport || "",
      skill: player.skill || player.skillLevel || "",
      location: player.location || "",
      status: "Pending",
      createdAt: serverTimestamp(),
    };

    const loadingToast = toast.loading("Sending play request...");

    try {
      await addDoc(collection(db, "requests"), newRequest);
      
      // Also send a notification to receiver
      let senderName = email?.split("@")[0] || "Someone";
      const q = query(collection(db, "players"), where("ownerId", "==", uid));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        senderName = qSnap.docs[0].data().name || senderName;
      }

      await addDoc(collection(db, "notifications"), {
        userId: player.ownerId,
        message: `${senderName} sent you a play request for ${player.game || player.sport}.`,
        type: "request",
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast.dismiss(loadingToast);
      toast.success(`Play request sent to ${player.name}`);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error sending request: ", error);
      toast.error("Failed to send request: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading local game partners...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-800">
          Find Game Partners
        </h1>
        <p className="font-body text-base leading-relaxed text-slate-500 mt-2">
          Browse local players, filter by availability or sport, and connect instantly.
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-[#FFF9F2]/80 backdrop-blur-md border border-orange-100/50 p-6 rounded-3xl shadow-xl mb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="font-body font-semibold block text-xs uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
            Search Name
          </label>
          <input
            type="text"
            placeholder="Search name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="font-body font-normal w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-sm"
          />
        </div>

        <div>
          <label className="font-body font-semibold block text-xs uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
            Game Type
          </label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="font-body font-normal w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-sm"
          >
            <option value="">All Games</option>
            {games.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-body font-semibold block text-xs uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
            Skill Level
          </label>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="font-body font-normal w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-sm"
          >
            <option value="">All Skill Levels</option>
            {skillLevels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-body font-semibold block text-xs uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
            Available Day
          </label>
          <select
            value={availDay}
            onChange={(e) => setAvailDay(e.target.value)}
            className="font-body font-normal w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-sm"
          >
            <option value="">Any Day</option>
            {DAYS_OF_WEEK.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-body font-semibold block text-xs uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
            Available Time
          </label>
          <select
            value={availTime}
            onChange={(e) => setAvailTime(e.target.value)}
            className="font-body font-normal w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-sm"
          >
            <option value="">Any Time</option>
            {TIMES_OF_DAY.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-body font-semibold block text-xs uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
            Location
          </label>
          <input
            type="text"
            placeholder="Search location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="font-body font-normal w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-sm"
          />
        </div>
      </div>

      {/* Players List Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-3xl p-12 text-center shadow-lg">
          <span className="text-4xl">🔍</span>
          <h3 className="font-heading text-xl font-semibold text-slate-800 mt-4">No Matching Partners Found</h3>
          <p className="font-body text-base leading-relaxed text-slate-500 mt-2">Try relaxing your filter criteria or searching in a wider location.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {filteredPlayers.map((player) => {
            const distance = userCoords && player.latitude && player.longitude
              ? getDistance(userCoords.latitude, userCoords.longitude, player.latitude, player.longitude)
              : null;

            return (
              <div
                key={player.id}
                className="bg-[#FFF9F2]/90 backdrop-blur-sm border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-heading text-xl font-semibold text-slate-800 truncate flex items-center gap-1.5">
                        {player.name}
                      </h3>
                      {player.isVerified && (
                        <span className="font-body text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase tracking-wide">
                          ✔ Verified Player
                        </span>
                      )}
                    </div>
                    <span className="font-body font-semibold bg-orange-50 text-[#E65100] text-xs px-2.5 py-1 rounded-full uppercase tracking-wider border border-orange-100">
                      {player.skill || player.skillLevel}
                    </span>
                  </div>

                  <div className="font-body text-base leading-relaxed space-y-2 text-slate-600">
                    <p className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-5 text-center">🎮</span>
                      <strong className="text-slate-700 font-semibold">Game:</strong> {player.game || player.sport}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-5 text-center">📍</span>
                      <strong className="text-slate-700 font-semibold">Location:</strong> {player.location}
                    </p>
                    {distance !== null && (
                      <p className="flex items-center gap-2 text-xs font-semibold text-orange-600">
                        <span className="text-orange-600 font-medium w-5 text-center">📏</span>
                        {distance.toFixed(1)} km away
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-5 text-center">🏠</span>
                      <strong className="text-slate-700 font-semibold">Place:</strong> {player.locationType || "Local Court"}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-5 text-center">📅</span>
                      <strong className="text-slate-700 font-semibold">Availability:</strong> {player.availabilityPeriod || player.availabilityTimeStr || "Morning"}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-5 text-center">⏰</span>
                      <strong className="text-slate-700 font-semibold">Preferred Time:</strong> {player.preferredTime || "12:20 PM"}
                    </p>
                  </div>
                  <div className="mt-4">
                    <LocationNameMap locationName={player.location} />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => sendRequest(player)}
                    className="font-body font-semibold flex-1 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-2.5 px-4 rounded-xl shadow transition duration-200 text-center text-sm"
                  >
                    Send Play Request
                  </button>
                  <Link
                    to={`/player/${player.id}`}
                    className="font-body font-semibold bg-orange-50 hover:bg-orange-100 text-orange-800 py-2.5 px-4 rounded-xl transition duration-200 text-center text-sm"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FindPartner;