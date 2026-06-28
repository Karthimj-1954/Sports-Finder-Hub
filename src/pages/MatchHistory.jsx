import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { toast } from "react-hot-toast";

function MatchHistory() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form states
  const [partnerName, setPartnerName] = useState("");
  const [game, setGame] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Completed");

  const userId = auth.currentUser?.uid;

  const fetchMatches = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, "matches"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const matchesList = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      // Sort newest date first
      matchesList.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setMatches(matchesList);
    } catch (error) {
      console.error("Error loading matches: ", error);
      toast.error("Failed to load match history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchMatches();
    });
  }, []);

  const handleLogMatch = async (e) => {
    e.preventDefault();

    if (!partnerName.trim() || !game.trim() || !date) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to log a match.");
      return;
    }

    const newMatch = {
      userId,
      partnerName: partnerName.trim(),
      game: game.trim(),
      date,
      status,
      createdAt: new Date().toISOString(),
    };

    const loadingToast = toast.loading("Logging match record...");
    try {
      await addDoc(collection(db, "matches"), newMatch);
      toast.dismiss(loadingToast);
      toast.success("Match logged successfully!");
      setPartnerName("");
      setGame("");
      setDate("");
      setStatus("Completed");
      setShowLogForm(false);
      fetchMatches();
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error logging match: ", error);
      toast.error("Failed to log match: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading match history...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 mb-20">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-800">
            Match History
          </h1>
          <p className="font-body text-base leading-relaxed text-slate-500 mt-1">
            Keep track of your completed and cancelled game sessions.
          </p>
        </div>
        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="font-body font-semibold bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-3 px-6 rounded-xl shadow-lg transition duration-200 text-sm text-center"
        >
          {showLogForm ? "Cancel Logging" : "📝 Log a Match"}
        </button>
      </div>

      {/* Log Form Box */}
      {showLogForm && (
        <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-6 rounded-3xl shadow-xl mb-10 max-w-xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-slate-800 mb-4">Log Match Result</h2>
          <form onSubmit={handleLogMatch} className="space-y-4">
            <div>
              <label className="font-body block text-sm font-semibold text-slate-600 mb-1">Partner Name *</label>
              <input
                type="text"
                placeholder="Who did you play with?"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                required
              />
            </div>
            <div>
              <label className="font-body block text-sm font-semibold text-slate-600 mb-1">Game / Sport *</label>
              <input
                type="text"
                placeholder="e.g. Swimming, Badminton, Football"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body block text-sm font-semibold text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="font-body block text-sm font-semibold text-slate-600 mb-1">Match Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                >
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="font-body w-full font-semibold bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl shadow-md transition duration-200"
            >
              Add Record
            </button>
          </form>
        </div>
      )}

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-3xl p-12 text-center shadow-lg">
          <span className="text-4xl">🏅</span>
          <h3 className="font-heading text-xl font-semibold text-slate-800 mt-4">No Matches Recorded</h3>
          <p className="font-body text-base leading-relaxed text-slate-500 mt-2">
            You haven&apos;t recorded any matches yet. Log one manually or complete active requests!
          </p>
        </div>
      ) : (
        <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 font-body text-xs font-semibold uppercase tracking-wider text-slate-500 bg-orange-50/20">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Partner</th>
                  <th className="py-4 px-6">Game</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm text-slate-700 divide-y divide-orange-50">
                {matches.map((match) => (
                  <tr key={match.id} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-6 font-semibold text-slate-500">{match.date}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{match.partnerName}</td>
                    <td className="py-4 px-6">{match.game}</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`font-body font-bold text-xs px-3 py-1 rounded-full border ${
                          match.status === "Completed"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}
                      >
                        {match.status === "Completed" ? "✔ Completed" : "❌ Cancelled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchHistory;
