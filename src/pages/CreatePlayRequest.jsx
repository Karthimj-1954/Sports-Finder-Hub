import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { games, locationTypes, skillLevels } from "../data/games";
import LocationNameMap from "../components/LocationNameMap";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

function formatTimeTo12Hour(time24) {
  if (!time24) return "";
  if (time24.includes("AM") || time24.includes("PM")) return time24;
  const [hours, minutes] = time24.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

function CreatePlayRequest() {
  const navigate = useNavigate();

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  const [gamesList, setGamesList] = useState(games);
  const [game, setGame] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [playersNeeded, setPlayersNeeded] = useState("");
  const [skill, setSkill] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        if (!catSnap.empty) {
          setGamesList(catSnap.docs.map((docSnap) => docSnap.data().name));
        }
      } catch (error) {
        console.error("Error fetching categories: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Preparing play session..." />;
  }

  const createRequest = async (e) => {
    e.preventDefault();

    if (!game || !location || !locationType || !date || !time || !playersNeeded || !skill) {
      toast.error("Please fill all fields");
      return;
    }

    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid) {
      toast.error("Please login to create a play request");
      return;
    }

    const newRequest = {
      creatorId: uid,
      creatorEmail: email || "",
      game,
      location,
      locationType,
      latitude: latitude || 0,
      longitude: longitude || 0,
      date,
      time: formatTimeTo12Hour(time),
      playersNeeded: parseInt(playersNeeded, 10),
      skill,
      status: "Open",
      createdAt: serverTimestamp(),
    };

    const loadingToast = toast.loading("Creating play request...");

    try {
      await addDoc(collection(db, "playRequests"), newRequest);
      toast.dismiss(loadingToast);
      toast.success("Play request created successfully!");
      navigate("/");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error creating play request: ", error);
      toast.error("Failed to create play request: " + error.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 px-4 mb-20">
      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-8 rounded-3xl shadow-2xl text-slate-800">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-800">
            Create Play Request
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            Host a game session and invite players to join you.
          </p>
        </div>

        <form onSubmit={createRequest} className="space-y-4">
          <div>
            <label className="font-body font-medium block text-sm text-slate-700 mb-1.5">Game *</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="font-body font-normal w-full p-3.5 border border-orange-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              required
            >
              <option value="">Select Game</option>
              {gamesList.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body font-medium block text-sm text-slate-700 mb-1.5">Location *</label>
            <input
              type="text"
              placeholder="e.g. Community Center or Local Ground"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="font-body font-normal w-full p-3.5 border border-orange-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              required
            />
            <LocationNameMap
              locationName={location}
              onCoordsResolved={(lat, lon) => {
                setLatitude(lat);
                setLongitude(lon);
              }}
            />
          </div>

          <div>
            <label className="font-body font-medium block text-sm text-slate-700 mb-1.5">Location Type *</label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="font-body font-normal w-full p-3.5 border border-orange-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              required
            >
              <option value="">Select Location Type</option>
              {locationTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-1.5">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-body font-normal w-full p-3.5 border border-orange-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              />
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-1.5">Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="font-body font-normal w-full p-3.5 border border-orange-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-1.5">Players Needed *</label>
              <input
                type="number"
                min="1"
                placeholder="Number of players"
                value={playersNeeded}
                onChange={(e) => setPlayersNeeded(e.target.value)}
                className="font-body font-normal w-full p-3.5 border border-orange-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              />
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-1.5">Preferred Skill Level *</label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="font-body font-normal w-full p-3.5 border border-orange-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              >
                <option value="">Preferred Skill Level</option>
                {skillLevels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              className="font-body font-semibold flex-1 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 text-center text-sm"
            >
              Create Request
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-body font-semibold px-6 py-3.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl transition duration-200 text-sm text-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePlayRequest;