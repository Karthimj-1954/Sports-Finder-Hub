import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { games, locationTypes, skillLevels } from "../data/games";
import LocationNameMap from "../components/LocationNameMap";
import { auth, db, storage } from "../firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, arrayRemove, onSnapshot } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const user = auth.currentUser;

  const [profileId, setProfileId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      console.log("Current User:", user.uid);
      console.log("onSnapshot available:", !!onSnapshot);
    }
  }, [user]);

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

  if (!user) {
    return null;
  }

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

  const deleteProfileOnly = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm("Are you sure you want to delete your sports partner profile? This will delete your finder profile but keep your account active.")) {
      return;
    }

    console.log("Deleting player profile only for:", user.uid);
    const loadingToast = toast.loading("Deleting profile...");

    try {
      const q = query(
        collection(db, "players"),
        where("ownerId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      await Promise.all(
        snapshot.docs.map((item) =>
          deleteDoc(doc(db, "players", item.id))
        )
      );

      setProfileId(null);
      setProfile(null);
      setIsEditing(false);

      // Reset form state
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
      toast.success("Player profile deleted successfully.");
      navigate("/profile", { replace: true });
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error(error.message);
    }
  };

  const deleteEntireAccount = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    if (!window.confirm("Are you sure? This action will permanently delete your account and all associated data.")) {
      return;
    }

    console.log("Deleting complete account:", userId);
    const loadingToast = toast.loading("Deleting entire account...");

    try {
      // 1. Fetch all Firestore documents that need to be deleted
      const playersQuery = query(collection(db, "players"), where("ownerId", "==", userId));
      const playReqQuery = query(collection(db, "playRequests"), where("creatorId", "==", userId));
      const reqSenderQuery = query(collection(db, "requests"), where("senderId", "==", userId));
      const reqReceiverQuery = query(collection(db, "requests"), where("receiverId", "==", userId));
      const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", userId));
      const historyQuery = query(collection(db, "history"), where("userId", "==", userId));

      const [
        playersSnap,
        playReqSnap,
        senderSnap,
        receiverSnap,
        notificationsSnap,
        historySnap
      ] = await Promise.all([
        getDocs(playersQuery),
        getDocs(playReqQuery),
        getDocs(reqSenderQuery),
        getDocs(reqReceiverQuery),
        getDocs(notificationsQuery),
        getDocs(historyQuery)
      ]);

      const userDocRef = doc(db, "users", userId);
      const deletePromises = [
        ...playersSnap.docs.map((d) => deleteDoc(doc(db, "players", d.id))),
        ...playReqSnap.docs.map((d) => deleteDoc(doc(db, "playRequests", d.id))),
        ...senderSnap.docs.map((d) => deleteDoc(doc(db, "requests", d.id))),
        ...receiverSnap.docs.map((d) => deleteDoc(doc(db, "requests", d.id))),
        ...notificationsSnap.docs.map((d) => deleteDoc(doc(db, "notifications", d.id))),
        ...historySnap.docs.map((d) => deleteDoc(doc(db, "history", d.id))),
        deleteDoc(userDocRef)
      ];

      // 2. Fetch communities to update membership or delete
      const communitiesSnap = await getDocs(collection(db, "communities"));
      communitiesSnap.forEach((communityDoc) => {
        const commData = communityDoc.data();
        if (commData.createdBy === userId) {
          deletePromises.push(deleteDoc(doc(db, "communities", communityDoc.id)));
        } else if (commData.members && commData.members.includes(userId)) {
          deletePromises.push(updateDoc(doc(db, "communities", communityDoc.id), {
            members: arrayRemove(userId)
          }));
        }
      });

      // 3. Delete profile image from Firebase Storage if it exists
      if (profileImage && profileImage.includes("firebasestorage.googleapis.com")) {
        try {
          const storageRefObj = storageRef(storage, profileImage);
          deletePromises.push(deleteObject(storageRefObj));
        } catch (storageErr) {
          console.warn("Storage deletion error ignored: ", storageErr.message);
        }
      }

      // Execute all database/storage updates
      await Promise.all(deletePromises);

      // 4. Delete user authentication account
      const authUser = auth.currentUser;
      if (authUser) {
        await deleteUser(authUser);
      }

      toast.dismiss(loadingToast);
      toast.success("Account and all associated data deleted successfully.");

      // 5. Clear state variables
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

      // 6. Clear local/session cache and sign out
      localStorage.clear();
      sessionStorage.clear();
      await auth.signOut();
      navigate("/login");

    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error deleting complete account:", error);
      if (error.code === "auth/requires-recent-login") {
        toast.error("Please re-authenticate (log out and log back in) before deleting your account.");
      } else {
        toast.error("Failed to delete account: " + error.message);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your profile..." />;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 mb-20">
      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-8 rounded-3xl shadow-2xl text-slate-800">
        {profile && !isEditing ? (
          <div>
            <div className="mb-6">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-800">
                Player Profile Details
              </h1>
              <p className="font-body text-sm text-slate-500 mt-1">
                Your current active sports partner profile on Sports Finder Hub.
              </p>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-3xl font-bold shadow-md">
                    {name ? name[0].toUpperCase() : "U"}
                  </div>
                )}
                <div>
                  <h2 className="font-heading text-2xl font-bold text-slate-800">{name}</h2>
                  <p className="font-body text-sm text-slate-500">{gender || "Not specified"}{age ? `, ${age} years old` : ""}</p>
                </div>
              </div>

              <hr className="border-orange-100/50" />

              <div className="grid md:grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Preferred Sport / Game</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{game || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Skill Level</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{skill || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Location Type</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{locationType || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Location Name</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{location || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Availability Days</p>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {availabilityDays && availabilityDays.length > 0 ? availabilityDays.join(", ") : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Availability Time</p>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {availabilityPeriod || "Not specified"} {preferredTime ? `(${preferredTime})` : ""}
                  </p>
                </div>
              </div>

              {about && (
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">About Me</p>
                  <p className="text-slate-700 mt-1 whitespace-pre-line text-sm">{about}</p>
                </div>
              )}

              {experience && (
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Experience</p>
                  <p className="text-slate-700 mt-1 whitespace-pre-line text-sm">{experience}</p>
                </div>
              )}

              {achievements && (
                <div>
                  <p className="text-slate-400 font-medium uppercase text-[10px]">Achievements</p>
                  <p className="text-slate-700 mt-1 whitespace-pre-line text-sm">{achievements}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 text-sm font-body">
                {phone && (
                  <div>
                    <p className="text-slate-400 font-medium uppercase text-[10px]">Phone</p>
                    <p className="text-slate-800 font-semibold mt-0.5">{phone}</p>
                  </div>
                )}
                {instagram && (
                  <div>
                    <p className="text-slate-400 font-medium uppercase text-[10px]">Instagram</p>
                    <p className="text-slate-800 font-semibold mt-0.5">@{instagram}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="font-body font-semibold flex-1 min-w-[120px] bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-200 text-center text-sm"
                >
                  ✏️ Edit Profile
                </button>
                <button
                  type="button"
                  onClick={deleteProfileOnly}
                  className="font-body font-semibold px-6 py-4 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-2xl transition duration-200 text-sm text-center"
                >
                  🗑️ Delete Profile
                </button>
                <button
                  type="button"
                  onClick={deleteEntireAccount}
                  className="font-body font-semibold px-6 py-4 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 rounded-2xl transition duration-200 text-sm text-center"
                >
                  ⚠️ Delete Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-800">
                {profileId ? "Edit Player Profile" : "Create Player Profile"}
              </h1>
              <p className="font-body text-sm text-slate-500 mt-1">
                {profileId
                  ? "Fill in your preferred games and availability to connect with local players."
                  : "Set up your preferred games and availability to start connecting with local players."}
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
                <label className="font-body font-medium block text-sm text-slate-700 mb-2">Availability Days</label>
                <div className="flex flex-wrap gap-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = availabilityDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`font-body text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 ${
                          isSelected
                            ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md"
                            : "bg-[#FFF9F2]/75 hover:bg-orange-50 text-slate-600 border border-orange-100/50"
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
                  <label className="font-body font-medium block text-sm text-slate-700 mb-2">Availability Period</label>
                  <select
                    value={availabilityPeriod}
                    onChange={(e) => setAvailabilityPeriod(e.target.value)}
                    className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                  >
                    <option value="">Select Availability Period</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>

                <div>
                  <label className="font-body font-medium block text-sm text-slate-700 mb-2">Preferred Time</label>
                  <input
                    type="time"
                    value={rawTime}
                    onChange={(e) => {
                      setRawTime(e.target.value);
                      setPreferredTime(formatTimeTo12Hour(e.target.value));
                    }}
                    className="font-body font-normal w-full p-4 border border-orange-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="font-body font-medium block text-sm text-slate-700 mb-2">Location Type *</label>
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

                <div>
                  <label className="font-body font-medium block text-sm text-slate-700 mb-2">Location Name *</label>
                  <LocationNameMap
                    value={location}
                    onChange={(val, lat, lng) => {
                      setLocation(val);
                      if (lat !== undefined) setLatitude(lat);
                      if (lng !== undefined) setLongitude(lng);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="font-body font-medium block text-sm text-slate-700 mb-2">About Me</label>
                <textarea
                  placeholder="Tell other players a bit about yourself, your style, etc..."
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
                    onClick={deleteEntireAccount}
                    className="font-body font-semibold px-6 py-4 bg-red-100 hover:bg-red-200 text-red-750 border border-red-200 rounded-2xl transition duration-200 text-sm text-center"
                  >
                    🗑️ Delete Account
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (profile) {
                      setIsEditing(false);
                    } else {
                      navigate("/");
                    }
                  }}
                  className="font-body font-semibold px-6 py-4 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-2xl transition duration-200 text-sm text-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;