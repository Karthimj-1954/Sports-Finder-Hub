import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { games, locationTypes, skillLevels } from "../data/games";
import LocationNameMap from "../components/LocationNameMap";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTimeTo12Hour(time24) {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

function convert12HourTo24Hour(time12) {
  if (!time12) return "";
  const match = time12.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return "";
  let [, hoursStr, minutesStr, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  ampm = ampm.toUpperCase();
  if (ampm === "PM" && hours < 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    hours = 0;
  }
  const hh = String(hours).padStart(2, "0");
  return `${hh}:${minutesStr}`;
}

function Profile() {
  const navigate = useNavigate();

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);
  console.log("Current Profile State:", profile);

  const [profileId, setProfileId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [gamesList, setGamesList] = useState(games);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [game, setGame] = useState("");
  const [skill, setSkill] = useState("");
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [availabilityPeriod, setAvailabilityPeriod] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [rawTime, setRawTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState("");
  const [achievements, setAchievements] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Fetch Categories
        const catSnap = await getDocs(collection(db, "categories"));
        if (!catSnap.empty) {
          setGamesList(catSnap.docs.map((docSnap) => docSnap.data().name));
        }

        const q = query(collection(db, "players"), where("ownerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          setProfileId(docSnap.id);
          setProfile(data);
          setName(data.name || "");
          setAge(data.age || "");
          setGender(data.gender || "");
          setGame(data.game || data.sport || "");
          setSkill(data.skill || data.skillLevel || "");
          setAvailabilityDays(data.availabilityDays || (data.availabilityDay ? data.availabilityDay.split(", ") : []));
          setAvailabilityPeriod(data.availabilityPeriod || "");
          const pTime = data.preferredTime || "";
          setPreferredTime(pTime);
          setRawTime(convert12HourTo24Hour(pTime));
          setLocation(data.location || "");
          setLocationType(data.locationType || "");
          setAbout(data.about || "");
          setExperience(data.experience || "");
          setAchievements(data.achievements || "");
          setPhone(data.phone || "");
          setInstagram(data.instagram || "");
          setProfileImage(data.profileImage || "");
          setLatitude(data.latitude || 0);
          setLongitude(data.longitude || 0);
          setIsVerified(data.isVerified || false);
        }
      } catch (error) {
        console.error("Error fetching profile: ", error);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (profile) {
      console.log("Active profile loaded for edit:", profile.name);
    }
  }, [profile]);

  const toggleDay = (day) => {
    setAvailabilityDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    if (!name || !game || !skill || !location || !locationType) {
      toast.error("Please fill all required fields");
      return;
    }

    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid) {
      toast.error("You must be logged in to save your profile.");
      return;
    }

    const profileData = {
      ownerId: uid,
      ownerEmail: email || "",
      name,
      age: parseInt(age, 10) || 0,
      gender,
      sport: game,
      game: game, // backward compatibility
      skillLevel: skill,
      skill: skill, // backward compatibility
      availabilityDays,
      availabilityDay: availabilityDays.join(", "), // backward compatibility
      availabilityPeriod,
      preferredTime,
      availabilityTime: [availabilityPeriod],
      availabilityTimes: [availabilityPeriod],
      availabilityTimeStr: availabilityPeriod,
      location,
      locationType,
      latitude: latitude || 0,
      longitude: longitude || 0,
      about,
      experience,
      achievements,
      phone,
      instagram,
      profileImage: profileImage || "",
      isVerified,
      createdAt: new Date().toISOString(),
    };

    const loadingToast = toast.loading("Saving profile...");

    try {
      const q = query(collection(db, "players"), where("ownerId", "==", uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "players", docId), profileData);
        setProfileId(docId);
        setProfile(profileData);
      } else {
        const docRef = await addDoc(collection(db, "players"), profileData);
        setProfileId(docRef.id);
        setProfile(profileData);
      }
      toast.dismiss(loadingToast);
      toast.success("Profile saved successfully!");
      navigate("/");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error saving profile: ", error);
      toast.error("Failed to save profile: " + error.message);
    }
  };

  const deleteProfile = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    if (!window.confirm("Are you sure you want to delete your sports partner profile? This action cannot be undone.")) {
      return;
    }

    console.log("Deleting player profile for:", userId);
    const loadingToast = toast.loading("Deleting profile...");

    try {
      const q = query(
        collection(db, "players"),
        where("ownerId", "==", userId)
      );

      const snapshot = await getDocs(q);

      await Promise.all(
        snapshot.docs.map((item) =>
          deleteDoc(doc(db, "players", item.id))
        )
      );

      // Clean up related match requests where this user is sender or receiver
      const reqSenderQuery = query(collection(db, "requests"), where("senderId", "==", userId));
      const reqReceiverQuery = query(collection(db, "requests"), where("receiverId", "==", userId));
      const [senderSnap, receiverSnap] = await Promise.all([
        getDocs(reqSenderQuery),
        getDocs(reqReceiverQuery)
      ]);
      await Promise.all([
        ...senderSnap.docs.map((item) => deleteDoc(doc(db, "requests", item.id))),
        ...receiverSnap.docs.map((item) => deleteDoc(doc(db, "requests", item.id)))
      ]);

      // Clean up notifications for this user
      const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", userId));
      const notificationsSnap = await getDocs(notificationsQuery);
      await Promise.all(
        notificationsSnap.docs.map((item) => deleteDoc(doc(db, "notifications", item.id)))
      );

      // Clear profile state variables
      setProfileId(null);
      setProfile(null);
      setName("");
      setAge("");
      setGender("");
      setGame("");
      setSkill("");
      setAvailabilityDays([]);
      setAvailabilityPeriod("");
      setPreferredTime("");
      setRawTime("");
      setLocation("");
      setLocationType("");
      setLatitude(0);
      setLongitude(0);
      setAbout("");
      setExperience("");
      setAchievements("");
      setPhone("");
      setInstagram("");
      setProfileImage("");
      setIsVerified(false);

      toast.dismiss(loadingToast);
      toast.success("Profile deleted successfully.");
      navigate("/");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading profile details...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 mb-20">
      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-8 rounded-3xl shadow-2xl text-slate-800">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-800">
            Edit Player Profile
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
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Age</label>
              <input
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              />
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer Not to Say">Prefer Not to Say</option>
              </select>
            </div>
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
                {gamesList.map((item) => (
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

          <div>
            <label className="font-body font-medium block text-sm text-slate-700 mb-2">Available Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = availabilityDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`font-body font-semibold py-2.5 px-4 rounded-xl text-xs border transition duration-200 ${
                      isSelected
                        ? "bg-orange-600 border-orange-600 text-white shadow"
                        : "bg-orange-50/50 border-orange-100 text-orange-800 hover:bg-orange-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Availability Period *</label>
              <select
                value={availabilityPeriod}
                onChange={(e) => setAvailabilityPeriod(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
              >
                <option value="">Select Availability Period</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Preferred Time *</label>
              <input
                type="time"
                value={rawTime}
                onChange={(e) => {
                  setRawTime(e.target.value);
                  setPreferredTime(formatTimeTo12Hour(e.target.value));
                }}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                required
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
              <LocationNameMap
                locationName={location}
                onCoordsResolved={(lat, lon) => {
                  setLatitude(lat);
                  setLongitude(lon);
                }}
              />
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

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Experience</label>
              <textarea
                placeholder="Describe your playing history/experience..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows="3"
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              />
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Achievements</label>
              <textarea
                placeholder="Mention any tournament titles, achievements, or honors..."
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                rows="3"
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              />
            </div>

            <div>
              <label className="font-body font-medium block text-sm text-slate-700 mb-2">Instagram Username</label>
              <input
                type="text"
                placeholder="e.g. handle_name (without @)"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <button
              type="submit"
              className="font-body font-semibold flex-1 min-w-[150px] bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-200 text-center text-sm"
            >
              Save Profile
            </button>
            {profileId && (
              <button
                type="button"
                onClick={deleteProfile}
                className="font-body font-semibold px-6 py-4 bg-red-150 hover:bg-red-200 text-red-750 border border-red-200 rounded-2xl transition duration-200 text-sm text-center"
              >
                🗑️ Delete Profile
              </button>
            )}
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