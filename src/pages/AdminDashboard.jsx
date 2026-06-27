import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

// Chart.js registration
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function AdminDashboard() {
  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [playRequests, setPlayRequests] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab management
  const [activeTab, setActiveTab] = useState("overview");

  // New category form
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchAllData = async () => {
    try {
      // 1. Fetch Players
      const playersSnap = await getDocs(collection(db, "players"));
      setPlayers(playersSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));

      // 2. Fetch Requests
      const requestsSnap = await getDocs(collection(db, "requests"));
      setRequests(requestsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));

      // 3. Fetch Play Requests (Hosted Sessions)
      const playRequestsSnap = await getDocs(collection(db, "playRequests"));
      setPlayRequests(playRequestsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));

      // 4. Fetch Communities
      const communitiesSnap = await getDocs(collection(db, "communities"));
      setCommunities(communitiesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));

      // 5. Fetch Sports Categories
      const categoriesSnap = await getDocs(collection(db, "sportsCategories"));
      setCategories(categoriesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    } catch (error) {
      console.error("Error loading admin stats: ", error);
      toast.error("Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAllData();
    });
  }, []);

  const deletePlayer = async (playerId) => {
    if (!window.confirm("Are you sure you want to delete this player profile?")) return;
    try {
      await deleteDoc(doc(db, "players", playerId));
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      toast.success("Player profile deleted successfully.");
    } catch (error) {
      console.error("Error deleting player: ", error);
      toast.error("Failed to delete profile.");
    }
  };

  const toggleVerification = async (player) => {
    const nextStatus = !player.isVerified;
    try {
      await updateDoc(doc(db, "players", player.id), { isVerified: nextStatus });
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, isVerified: nextStatus } : p))
      );
      toast.success(`Verification ${nextStatus ? "granted" : "revoked"} for ${player.name}!`);
    } catch (error) {
      console.error("Error toggling verification: ", error);
      toast.error("Failed to toggle player verification.");
    }
  };

  const deleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to remove this match request?")) return;
    try {
      await deleteDoc(doc(db, "requests", requestId));
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Match request removed successfully.");
    } catch (error) {
      console.error("Error deleting request: ", error);
      toast.error("Failed to delete request.");
    }
  };

  const deleteCommunity = async (communityId) => {
    if (!window.confirm("Are you sure you want to remove this community group?")) return;
    try {
      await deleteDoc(doc(db, "communities", communityId));
      setCommunities((prev) => prev.filter((c) => c.id !== communityId));
      toast.success("Community group removed successfully.");
    } catch (error) {
      console.error("Error deleting community: ", error);
      toast.error("Failed to delete community.");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    const name = newCategoryName.trim();
    try {
      const docRef = await addDoc(collection(db, "sportsCategories"), { name });
      setCategories((prev) => [...prev, { id: docRef.id, name }]);
      setNewCategoryName("");
      toast.success(`Added category: ${name}`);
    } catch (error) {
      console.error("Error adding category: ", error);
      toast.error("Failed to add category.");
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Delete sports category "${categoryName}"?`)) return;
    try {
      await deleteDoc(doc(db, "sportsCategories", categoryId));
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      toast.success(`Removed category: ${categoryName}`);
    } catch (error) {
      console.error("Error deleting category: ", error);
      toast.error("Failed to delete category.");
    }
  };

  // Preparation for Chart 1: Users per sport
  const sportsCounts = {};
  players.forEach((p) => {
    const sport = p.game || p.sport || "Unknown";
    sportsCounts[sport] = (sportsCounts[sport] || 0) + 1;
  });

  const sportsChartData = {
    labels: Object.keys(sportsCounts),
    datasets: [
      {
        label: "Number of Players",
        data: Object.values(sportsCounts),
        backgroundColor: [
          "rgba(211, 84, 0, 0.6)",
          "rgba(230, 126, 34, 0.6)",
          "rgba(241, 196, 15, 0.6)",
          "rgba(46, 204, 113, 0.6)",
          "rgba(52, 152, 219, 0.6)",
          "rgba(155, 89, 182, 0.6)",
          "rgba(26, 188, 156, 0.6)",
        ],
        borderColor: [
          "rgba(211, 84, 0, 1)",
          "rgba(230, 126, 34, 1)",
          "rgba(241, 196, 15, 1)",
          "rgba(46, 204, 113, 1)",
          "rgba(52, 152, 219, 1)",
          "rgba(155, 89, 182, 1)",
          "rgba(26, 188, 156, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Preparation for Chart 2: Request status distribution
  const statusCounts = { Pending: 0, Accepted: 0, Declined: 0, Completed: 0, Cancelled: 0 };
  requests.forEach((r) => {
    const status = r.status || "Pending";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const requestChartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: "Requests Status",
        data: Object.values(statusCounts),
        backgroundColor: [
          "rgba(241, 196, 15, 0.6)", // Pending (yellow)
          "rgba(46, 204, 113, 0.6)", // Accepted (green)
          "rgba(231, 76, 60, 0.6)",  // Declined (red)
          "rgba(52, 152, 219, 0.6)",  // Completed (blue)
          "rgba(149, 165, 166, 0.6)", // Cancelled (grey)
        ],
        borderColor: [
          "rgba(241, 196, 15, 1)",
          "rgba(46, 204, 113, 1)",
          "rgba(231, 76, 60, 1)",
          "rgba(52, 152, 219, 1)",
          "rgba(149, 165, 166, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Get distinct Users count (uids from player profiles)
  const distinctUsers = new Set(players.map((p) => p.ownerId)).size;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading admin suite...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 mb-20">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-800">
          Admin Control Center
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Review community statistics, manage player verification, moderate groups, and update sports lists.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-xl">👤</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Total Users</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{distinctUsers}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-xl">🏃</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Total Profiles</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{players.length}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-xl">📥</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Total Requests</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{requests.length}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-xl">🎯</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Play Sessions</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{playRequests.length}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-xl">👥</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Communities</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{communities.length}</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap border-b border-orange-100 mb-8 gap-2">
        {["overview", "players", "requests", "communities", "categories"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-body font-bold text-sm py-2.5 px-5 border-b-2 transition uppercase tracking-wider ${
              activeTab === tab
                ? "border-orange-600 text-orange-850"
                : "border-transparent text-slate-400 hover:text-slate-650"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Chart 1 */}
          <div className="bg-[#FFF9F2]/90 border border-orange-100/50 p-6 rounded-3xl shadow-lg">
            <h3 className="font-heading text-lg font-bold text-slate-800 mb-4 text-center">Registered Players Per Sport</h3>
            <div className="h-[300px] flex items-center justify-center">
              {players.length > 0 ? (
                <Bar
                  data={sportsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              ) : (
                <p className="font-body text-slate-400 text-sm">No player data available to build chart.</p>
              )}
            </div>
          </div>

          {/* Chart 2 */}
          <div className="bg-[#FFF9F2]/90 border border-orange-100/50 p-6 rounded-3xl shadow-lg">
            <h3 className="font-heading text-lg font-bold text-slate-800 mb-4 text-center">Match Requests Status Distribution</h3>
            <div className="h-[300px] flex items-center justify-center">
              {requests.length > 0 ? (
                <Pie data={requestChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              ) : (
                <p className="font-body text-slate-400 text-sm">No requests data available to build chart.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "players" && (
        <div className="bg-[#FFF9F2]/90 border border-orange-100/50 rounded-3xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 font-body text-xs font-semibold uppercase tracking-wider text-slate-500 bg-orange-50/20">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Game / Sport</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6 text-center">Verified</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm text-slate-700 divide-y divide-orange-50">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">{player.name}</td>
                    <td className="py-4 px-6">{player.game || player.sport}</td>
                    <td className="py-4 px-6">{player.location}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleVerification(player)}
                        className={`font-body font-bold text-xs px-3 py-1 rounded-full border transition duration-200 cursor-pointer ${
                          player.isVerified
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                        }`}
                      >
                        {player.isVerified ? "✔ Verified" : "✖ Unverified"}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="font-body font-semibold bg-red-50 hover:bg-red-100 text-red-650 py-1.5 px-3 rounded-lg text-xs transition duration-200 cursor-pointer"
                      >
                        Delete Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-[#FFF9F2]/90 border border-orange-100/50 rounded-3xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 font-body text-xs font-semibold uppercase tracking-wider text-slate-500 bg-orange-50/20">
                  <th className="py-4 px-6">Sender</th>
                  <th className="py-4 px-6">Receiver</th>
                  <th className="py-4 px-6">Game</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm text-slate-700 divide-y divide-orange-50">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-6 font-semibold text-slate-800">{req.senderEmail || req.playerName}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{req.receiverEmail}</td>
                    <td className="py-4 px-6">{req.game}</td>
                    <td className="py-4 px-6 font-bold">{req.status}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => deleteRequest(req.id)}
                        className="font-body font-semibold bg-red-50 hover:bg-red-100 text-red-650 py-1.5 px-3 rounded-lg text-xs transition duration-200 cursor-pointer"
                      >
                        Delete Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "communities" && (
        <div className="bg-[#FFF9F2]/90 border border-orange-100/50 rounded-3xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 font-body text-xs font-semibold uppercase tracking-wider text-slate-500 bg-orange-50/20">
                  <th className="py-4 px-6">Group Name</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Creator</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm text-slate-700 divide-y divide-orange-50">
                {communities.map((c) => (
                  <tr key={c.id} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">{c.groupName}</td>
                    <td className="py-4 px-6 max-w-xs truncate">{c.description}</td>
                    <td className="py-4 px-6">{c.location}</td>
                    <td className="py-4 px-6 text-xs">{c.createdByEmail || c.createdBy}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => deleteCommunity(c.id)}
                        className="font-body font-semibold bg-red-50 hover:bg-red-100 text-red-650 py-1.5 px-3 rounded-lg text-xs transition duration-200 cursor-pointer"
                      >
                        Delete Group
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Add Category Form */}
          <div className="bg-[#FFF9F2]/90 border border-orange-100/50 p-6 rounded-3xl shadow-lg">
            <h3 className="font-heading text-xl font-bold text-slate-800 mb-4">Add Sports Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="font-body block text-xs font-bold text-slate-500 uppercase mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Swimming, Archery"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  required
                />
              </div>
              <button
                type="submit"
                className="font-body w-full font-bold bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl transition duration-200"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Categories list */}
          <div className="bg-[#FFF9F2]/90 border border-orange-100/50 p-6 rounded-3xl shadow-lg">
            <h3 className="font-heading text-xl font-bold text-slate-800 mb-4">Current Custom Categories</h3>
            {categories.length === 0 ? (
              <p className="font-body text-sm text-slate-400">No custom categories registered. Falls back to default list.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center bg-[#FFFDFB] p-3 rounded-xl border border-orange-50"
                  >
                    <span className="font-body text-sm font-bold text-slate-750">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="font-body text-xs font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;