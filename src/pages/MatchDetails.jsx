import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LocationNameMap from "../components/LocationNameMap";
import { auth, db } from "../firebase";
import { doc, getDoc, addDoc, query, collection, where, getDocs, serverTimestamp } from "firebase/firestore";
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

function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const docRef = doc(db, "playRequests", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMatch({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Play request session not found");
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading match session details: ", error);
        toast.error("Error loading request details");
      } finally {
        setLoading(false);
      }
    };
    fetchMatchDetails();
  }, [id, navigate]);

  const joinMatch = async () => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid) {
      toast.error("Please login to join play sessions");
      return;
    }

    if (match.creatorId === uid) {
      toast.error("You cannot send a join request to your own match listing.");
      return;
    }

    const joinReq = {
      senderId: uid,
      senderEmail: email || "",
      receiverId: match.creatorId || "",
      receiverEmail: match.creatorEmail || "",
      playerName: email?.split("@")[0] || "Someone",
      game: match.game || "",
      skill: match.skill || "Intermediate",
      location: match.location || "",
      status: "Pending",
      createdAt: serverTimestamp(),
    };

    const loadingToast = toast.loading("Sending join request...");

    try {
      // Find sender profile name to use in notification/request name
      let senderName = email?.split("@")[0] || "Someone";
      const q = query(collection(db, "players"), where("ownerId", "==", uid));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const profileData = qSnap.docs[0].data();
        senderName = profileData.name || senderName;
        joinReq.playerName = profileData.name || joinReq.playerName;
        joinReq.skill = profileData.skill || profileData.skillLevel || joinReq.skill;
      }

      await addDoc(collection(db, "requests"), joinReq);

      // Create notification
      await addDoc(collection(db, "notifications"), {
        userId: match.creatorId,
        message: `${senderName} wants to join your ${match.game} session.`,
        type: "request",
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast.dismiss(loadingToast);
      toast.success("Join request sent successfully!");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error sending join request: ", error);
      toast.error("Failed to send join request: " + error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading match session..." />;
  }

  if (!match) return null;

  // Google Maps link
  const mapQuery = match.latitude && match.longitude
    ? `${match.latitude},${match.longitude}`
    : encodeURIComponent(match.location);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 mb-20">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="font-body font-semibold flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-850 py-2.5 px-5 rounded-xl transition duration-200 text-sm mb-6 shadow-sm cursor-pointer"
      >
        <span>⬅</span> Back to Home
      </button>

      {/* Detail Card */}
      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-8 rounded-3xl shadow-2xl text-slate-800">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-800">Match Details</h1>
            <p className="font-body text-sm text-slate-500 mt-1">
              Host: <span className="font-semibold text-slate-700">{match.creatorEmail}</span>
            </p>
          </div>
          <span className="font-body font-semibold bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full uppercase border border-green-150">
            {match.status}
          </span>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6 bg-orange-50/30 p-5 rounded-2xl border border-orange-100">
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Game / Sport</span>
              <p className="font-heading text-lg font-bold text-slate-750 mt-1">{match.game}</p>
            </div>
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Skill Requirement</span>
              <p className="font-heading text-lg font-bold text-slate-750 mt-1">{match.skill}</p>
            </div>
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</span>
              <p className="font-heading text-base font-bold text-slate-700 mt-1">{formatDate(match.date)}</p>
            </div>
            <div>
              <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</span>
              <p className="font-heading text-base font-bold text-slate-700 mt-1">{match.time}</p>
            </div>
          </div>

          <div className="bg-[#FFFDFB] border border-orange-100 p-5 rounded-2xl shadow-sm">
            <span className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Players Needed</span>
            <p className="font-heading text-lg font-bold text-orange-800 mt-1">👥 {match.playersNeeded} player(s) required</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-bold text-slate-800">Playing Location</h3>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="font-body font-semibold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 py-1.5 px-3.5 rounded-xl shadow transition duration-200"
              >
                🗺️ Open in Google Maps
              </a>
            </div>

            <div className="bg-[#FFFDFB] border border-orange-100 p-4 rounded-2xl shadow-sm">
              <p className="font-body text-sm text-slate-650 mb-2">
                📍 {match.location} ({match.locationType || "Local Court"})
              </p>
              <LocationNameMap locationName={match.location} />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-100 flex gap-4">
            {match.creatorId !== userId && (
              <button
                onClick={joinMatch}
                className="font-body font-semibold flex-1 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 text-center text-sm cursor-pointer"
              >
                Request to Join Session
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="font-body font-semibold px-6 py-3.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl transition duration-200 text-sm text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchDetails;