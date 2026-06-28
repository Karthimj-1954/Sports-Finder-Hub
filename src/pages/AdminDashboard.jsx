import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, deleteDoc, doc, updateDoc, addDoc, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";

// Chart.js registration
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function AdminDashboard() {
  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  // Stats Counters
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalCommunities, setTotalCommunities] = useState(0);

  // Lists
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Debug logging
  console.log("Loaded players from Firestore:", players);
  console.log("Requests:", requests);
  console.log("Users:", users);
  console.log("Sessions:", sessions);

  useEffect(() => {
    let usersLoaded = false;
    let playersLoaded = false;
    let requestsLoaded = false;
    let sessionsLoaded = false;
    let communitiesLoaded = false;
    let categoriesLoaded = false;

    const checkFinished = () => {
      if (usersLoaded && playersLoaded && requestsLoaded && sessionsLoaded && communitiesLoaded && categoriesLoaded) {
        setLoading(false);
      }
    };

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        Promise.resolve().then(() => {
          setUsers(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
          );
          setTotalUsers(snapshot.size);
          usersLoaded = true;
          checkFinished();
        });
      },
      (error) => {
        console.error("Error listening to users: ", error);
        usersLoaded = true;
        checkFinished();
      }
    );

    const unsubPlayers = onSnapshot(
      collection(db, "players"),
      (snapshot) => {
        Promise.resolve().then(() => {
          setPlayers(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
          );
          setTotalProfiles(snapshot.size);
          playersLoaded = true;
          checkFinished();
        });
      },
      (error) => {
        console.error("Error listening to players: ", error);
        playersLoaded = true;
        checkFinished();
      }
    );

    const unsubRequests = onSnapshot(
      collection(db, "requests"),
      (snapshot) => {
        Promise.resolve().then(() => {
          setRequests(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
          );
          setTotalRequests(snapshot.size);
          requestsLoaded = true;
          checkFinished();
        });
      },
      (error) => {
        console.error("Error listening to requests: ", error);
        requestsLoaded = true;
        checkFinished();
      }
    );

    const unsubSessions = onSnapshot(
      collection(db, "playRequests"),
      (snapshot) => {
        Promise.resolve().then(() => {
          setSessions(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
          );
          setTotalSessions(snapshot.size);
          sessionsLoaded = true;
          checkFinished();
        });
      },
      (error) => {
        console.error("Error listening to sessions: ", error);
        sessionsLoaded = true;
        checkFinished();
      }
    );

    const unsubCommunities = onSnapshot(
      collection(db, "communities"),
      (snapshot) => {
        Promise.resolve().then(() => {
          setCommunities(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
          );
          setTotalCommunities(snapshot.size);
          communitiesLoaded = true;
          checkFinished();
        });
      },
      (error) => {
        console.error("Error listening to communities: ", error);
        communitiesLoaded = true;
        checkFinished();
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        Promise.resolve().then(() => {
          setCategories(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
          );
          categoriesLoaded = true;
          checkFinished();
        });
      },
      (error) => {
        console.error("Error listening to categories: ", error);
        categoriesLoaded = true;
        checkFinished();
      }
    );

    return () => {
      unsubUsers();
      unsubPlayers();
      unsubRequests();
      unsubSessions();
      unsubCommunities();
      unsubCategories();
    };
  }, []);

  const deletePlayer = async (playerId) => {
    if (!window.confirm("Are you sure you want to delete this player profile?")) return;
    try {
      await deleteDoc(doc(db, "players", playerId));
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
      await addDoc(collection(db, "categories"), { name });
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
      await deleteDoc(doc(db, "categories", categoryId));
      toast.success(`Removed category: ${categoryName}`);
    } catch (error) {
      console.error("Error deleting category: ", error);
      toast.error("Failed to delete category.");
    }
  };

  // Preparation for Chart 1: Users per sport
  const sportCounts = {};
  players.forEach((player) => {
    const sport = player.sport || player.game || "Unknown";
    sportCounts[sport] = (sportCounts[sport] || 0) + 1;
  });

  const playersChartData = {
    labels: Object.keys(sportCounts),
    datasets: [
      {
        label: "Players",
        data: Object.values(sportCounts),
        backgroundColor: [
          "#FF6B35",
          "#4CAF50",
          "#2196F3",
          "#FFC107",
          "#9C27B0",
          "#E91E63",
        ],
      },
    ],
  };

  // Preparation for Chart 2: Request status distribution
  const statusCounts = {
    Pending: 0,
    Accepted: 0,
    Declined: 0,
    Completed: 0,
  };
  requests.forEach((request) => {
    const status = request.status || "Pending";
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
  });

  const requestChartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          "#FFC107",
          "#4CAF50",
          "#F44336",
          "#2196F3",
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading dashboard...
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
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center animate-fade-in">
          <span className="text-xl">👤</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Total Users</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center animate-fade-in">
          <span className="text-xl">🏃</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Total Profiles</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{totalProfiles}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center animate-fade-in">
          <span className="text-xl">📥</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Total Requests</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{totalRequests}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center animate-fade-in">
          <span className="text-xl">🎯</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Play Sessions</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{totalSessions}</p>
        </div>
        <div className="bg-[#FFF9F2]/80 border border-orange-100 p-5 rounded-2xl shadow-sm text-center animate-fade-in">
          <span className="text-xl">👥</span>
          <h4 className="font-body text-[10px] uppercase font-bold text-slate-400 mt-1">Communities</h4>
          <p className="font-heading text-2xl font-extrabold text-slate-800 mt-1">{totalCommunities}</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap border-b border-orange-100 mb-8 gap-2">
        {["overview", "players", "requests", "communities", "categories"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-body font-bold text-sm py-2.5 px-5 border-b-2 transition uppercase tracking-wider cursor-pointer ${
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
                  data={playersChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              ) : (
                <p className="font-body text-slate-400 text-sm">No players registered yet.</p>
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
                <p className="font-body text-slate-400 text-sm">No requests available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "players" && (
        <div className="bg-[#FFF9F2]/90 border border-orange-100/50 rounded-3xl shadow-lg overflow-hidden">
          {players.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-body">No data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-orange-100 font-body text-xs font-semibold uppercase tracking-wider text-slate-500 bg-orange-50/20">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Preferred Sport</th>
                    <th className="py-4 px-6">Location</th>
                    <th className="py-4 px-6 text-center">Verified Status</th>
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
                          Delete Player
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-[#FFF9F2]/90 border border-orange-100/50 rounded-3xl shadow-lg overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-body">No data available.</div>
          ) : (
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
                    <tr key={req.id}>
                      <td className="py-4 px-6 font-semibold text-slate-800">{req.senderEmail || req.playerName}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{req.receiverEmail}</td>
                      <td className="py-4 px-6">{req.game}</td>
                      <td className="py-4 px-6 font-bold">{req.status}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => deleteRequest(req.id)}
                          className="font-body font-semibold bg-red-50 hover:bg-red-100 text-red-650 py-1.5 px-3 rounded-lg text-xs transition duration-200 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "communities" && (
        <div className="bg-[#FFF9F2]/90 border border-orange-100/50 rounded-3xl shadow-lg overflow-hidden">
          {communities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-body">No data available.</div>
          ) : (
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
          )}
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
                  className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDFB] transition duration-200"
                  required
                />
              </div>
              <button
                type="submit"
                className="font-body w-full font-bold bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl transition duration-200 cursor-pointer"
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
                      className="font-body text-xs font-semibold text-red-650 hover:underline cursor-pointer"
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