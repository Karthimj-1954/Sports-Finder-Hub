import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { games, locationTypes, skillLevels } from "../data/games";
import LocationNameMap from "../components/LocationNameMap";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

function Profile() {
  const navigate = useNavigate();

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  const [profileId, setProfileId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [skill, setSkill] = useState("");
  const [availabilityDay, setAvailabilityDay] = useState("");
  const [availabilityTime, setAvailabilityTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [about, setAbout] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "players"), where("ownerId", "==", uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          setProfileId(docSnap.id);
          setName(data.name || "");
          setGame(data.game || "");
          setSkill(data.skill || "");
          setAvailabilityDay(data.availabilityDay || "");
          setAvailabilityTime(data.availabilityTime || "");
          setLocation(data.location || "");
          setLocationType(data.locationType || "");
          setAbout(data.about || "");
        }
      } catch (error) {
        console.error("Error fetching profile: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();

    if (!name || !game || !skill || !location || !locationType) {
      alert("Please fill all required fields");
      return;
    }

    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid) {
      alert("You must be logged in to save your profile.");
      return;
    }

    const profileData = {
      ownerId: uid,
      ownerEmail: email || "",
      name,
      game,
      sport: game,
      skill,
      availabilityDay,
      availabilityTime,
      location,
      locationType,
      about,
    };

    try {
      if (profileId) {
        await updateDoc(doc(db, "players", profileId), profileData);
      } else {
        const docRef = await addDoc(collection(db, "players"), profileData);
        setProfileId(docRef.id);
      }
      alert("Profile saved successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error saving profile: ", error);
      alert("Failed to save profile: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-8 rounded-3xl shadow-2xl text-slate-800">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-800">
            Create Player Profile
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            Fill in your preferred games and availability to connect with local players.
          </p>
        </div>

        <form onSubmit={saveProfile} className="space-y-6">
          <div>
            <label className="font-body font-medium block text-sm text-slate-700 mb-2">Full Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Preferred Game *</label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              >
                <option value="">Select Preferred Game</option>
                {games.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Skill Level *</label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              >
                <option value="">Select Skill Level</option>
                {skillLevels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Available Days</label>
              <input
                type="text"
                placeholder="e.g. Saturday, Sunday"
                value={availabilityDay}
                onChange={(e) => setAvailabilityDay(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              />
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Available Time</label>
              <input
                type="text"
                placeholder="e.g. 5 PM - 7 PM"
                value={availabilityTime}
                onChange={(e) => setAvailabilityTime(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Playing Location *</label>
              <input
                type="text"
                placeholder="Enter city or neighborhood"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              />
              <LocationNameMap locationName={location} />
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Playing Location Type *</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
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
          </div>

          <div>
            <label className="font-body font-medium block text-sm text-slate-700 mb-2">About Me</label>
            <textarea
              placeholder="Tell other players a bit about yourself, your playstyle, or equipment..."
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows="4"
              className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              className="font-body font-semibold flex-1 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-200 text-center text-sm"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-body font-semibold px-6 py-4 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-2xl transition duration-200 text-sm text-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;