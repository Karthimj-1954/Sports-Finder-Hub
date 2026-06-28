import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LocationNameMap from "../components/LocationNameMap";
import { auth, db } from "../firebase";
import { doc, getDoc, addDoc, query, collection, where, getDocs, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";

function PlayerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        const docRef = doc(db, "players", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPlayer({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Player profile not found");
          navigate("/partner");
        }
      } catch (error) {
        console.error("Error loading player details: ", error);
        toast.error("Error loading profile");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayerDetails();
  }, [id, navigate]);

  const sendRequest = async () => {
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

      // Send a notification to receiver
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
      <div className="max-w-3xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading partner profile...
        </div>
      </div>
    );
  }

  if (!player) return null;

  // Google Maps link
  const mapQuery = player.latitude && player.longitude
    ? `${player.latitude},${player.longitude}`
    : encodeURIComponent(player.location);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  // Default avatar emoji fallback based on sport
  const getSportEmoji = (sportName) => {
    const nameLower = sportName?.toLowerCase() || "";
    if (nameLower.includes("football") || nameLower.includes("soccer")) return "⚽";
    if (nameLower.includes("cricket")) return "🏏";
    if (nameLower.includes("badminton")) return "🏸";
    if (nameLower.includes("tennis")) return "🎾";
    if (nameLower.includes("basketball")) return "🏀";
    if (nameLower.includes("chess")) return "♟️";
    if (nameLower.includes("carrom")) return "🥏";
    if (nameLower.includes("table tennis")) return "🏓";
    if (nameLower.includes("swimming")) return "🏊";
    return "🏃";
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 mb-20">
      {/* Back Button */}
      <button
        onClick={() => navigate("/partner")}
        className="font-body font-semibold flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-850 py-2.5 px-5 rounded-xl transition duration-200 text-sm mb-6 shadow-sm cursor-pointer"
      >
        <span>⬅</span> Back to Partners
      </button>

      {/* Main Profile Details Card */}
      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-8 text-white flex flex-col sm:flex-row items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex items-center justify-center shadow-lg text-5xl">
            {player.profileImage ? (
              <img
                src={player.profileImage}
                alt={player.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerText = getSportEmoji(player.game || player.sport);
                }}
              />
            ) : (
              getSportEmoji(player.game || player.sport)
            )}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="font-heading text-3xl font-bold">{player.name}</h1>
              {player.isVerified && (
                <span className="font-body text-[10px] font-bold text-green-800 bg-green-100 border border-green-300 px-2 py-0.5 rounded uppercase tracking-wider w-max mx-auto sm:mx-0">
                  ✔ Verified Player
                </span>
              )}
            </div>
            <p className="font-body text-orange-100 text-sm mt-1">
              Preferred Sport: <span className="font-bold text-white">{player.game || player.sport}</span>
            </p>
            <p className="font-body text-orange-100 text-sm">
              Preferred Skill Level: <span className="font-bold text-white">{player.skill || player.skillLevel}</span>
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-orange-50/50 p-6 rounded-2xl border border-orange-150">
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Age</span>
              <p className="font-heading text-lg font-bold text-slate-700 mt-1">{player.age || "N/A"}</p>
            </div>
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Gender</span>
              <p className="font-heading text-lg font-bold text-slate-700 mt-1">{player.gender || "N/A"}</p>
            </div>
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Instagram</span>
              <p className="font-heading text-lg font-bold text-slate-700 mt-1">
                {player.instagram ? (
                  <a
                    href={`https://instagram.com/${player.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    @{player.instagram}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</span>
              <p className="font-heading text-lg font-bold text-slate-700 mt-1">
                {player.phone ? (
                  <a href={`tel:${player.phone}`} className="text-orange-600 hover:underline">
                    {player.phone}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>

          {/* About / Experience */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-800 mb-2.5">About Me</h3>
              <p className="font-body text-base leading-relaxed text-slate-650">
                {player.about || "This player hasn't added a description yet."}
              </p>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-slate-800 mb-2.5">Playing Experience</h3>
              <p className="font-body text-base leading-relaxed text-slate-650">
                {player.experience || "No play history listed yet."}
              </p>
            </div>
          </div>

          {/* Achievements */}
          {player.achievements && (
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-800 mb-2.5">Sports Achievements</h3>
              <p className="font-body text-base leading-relaxed text-slate-650 bg-amber-50/30 border border-amber-100 p-4 rounded-xl">
                🏆 {player.achievements}
              </p>
            </div>
          )}

          {/* Availability schedule */}
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-800 mb-4">Availability Schedule</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#FFFDFB] border border-orange-100 p-5 rounded-2xl shadow-sm">
                <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Days Available
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {player.availabilityDays && player.availabilityDays.length > 0 ? (
                    player.availabilityDays.map((d) => (
                      <span key={d} className="font-body text-xs font-semibold bg-orange-100 text-[#8E2F00] px-3 py-1 rounded-lg">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="font-body text-sm text-slate-500 font-semibold">{player.availabilityDay || "N/A"}</span>
                  )}
                </div>
              </div>

              <div className="bg-[#FFFDFB] border border-orange-100 p-5 rounded-2xl shadow-sm">
                <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Availability / Preferred Time
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="font-body text-sm text-slate-700 font-semibold">
                    {player.availabilityPeriod || player.availabilityTimeStr || "Morning"}
                    {player.preferredTime ? ` (${player.preferredTime})` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Map */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-slate-800">Playing Location</h3>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="font-body font-semibold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 py-2 px-4 rounded-xl shadow transition duration-200"
              >
                🗺️ Open in Google Maps
              </a>
            </div>

            <div className="bg-[#FFFDFB] border border-orange-100 p-4 rounded-2xl shadow-sm">
              <p className="font-body text-sm leading-relaxed text-slate-600 mb-2">
                📍 {player.location} ({player.locationType || "Local Court"})
              </p>
              <LocationNameMap locationName={player.location} />
            </div>
          </div>

          {/* Invitation Action */}
          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button
              onClick={sendRequest}
              className="font-body font-semibold flex-1 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-200 text-center text-sm cursor-pointer"
            >
              Send Play Request
            </button>
            <button
              type="button"
              onClick={() => navigate("/partner")}
              className="font-body font-semibold px-6 py-4 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-2xl transition duration-200 text-sm text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerDetails;