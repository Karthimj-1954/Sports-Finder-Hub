import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { toast } from "react-hot-toast";

function CommunityGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const userId = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email;

  const fetchGroups = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "communities"));
      const groupsList = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      // Sort newest first
      groupsList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      setGroups(groupsList);
    } catch (error) {
      console.error("Error loading communities: ", error);
      toast.error("Failed to load community groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchGroups();
    });
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || !description.trim() || !location.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to create a community.");
      return;
    }

    const newGroup = {
      groupName: groupName.trim(),
      description: description.trim(),
      location: location.trim(),
      createdBy: userId,
      createdByEmail: userEmail || "",
      members: [userId],
      createdAt: new Date().toISOString(),
    };

    const loadingToast = toast.loading("Creating community group...");
    try {
      await addDoc(collection(db, "communities"), newGroup);
      toast.dismiss(loadingToast);
      toast.success(`Successfully created ${groupName}!`);
      
      // Reset form
      setGroupName("");
      setDescription("");
      setLocation("");
      setShowCreateForm(false);
      
      // Refresh list
      fetchGroups();
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error creating community: ", error);
      toast.error("Failed to create group: " + error.message);
    }
  };

  const handleJoinGroup = async (groupId, gName) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, "communities", groupId), {
        members: arrayUnion(userId),
      });
      toast.success(`Joined ${gName}!`);
      // Trigger notification for group joining (optionally)
      await addDoc(collection(db, "notifications"), {
        userId: userId,
        message: `You successfully joined the ${gName} community.`,
        type: "invite",
        read: false,
        createdAt: new Date().toISOString()
      });
      fetchGroups();
    } catch (error) {
      console.error("Error joining group: ", error);
      toast.error("Failed to join group.");
    }
  };

  const handleLeaveGroup = async (groupId, gName) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, "communities", groupId), {
        members: arrayRemove(userId),
      });
      toast.success(`Left ${gName}.`);
      fetchGroups();
    } catch (error) {
      console.error("Error leaving group: ", error);
      toast.error("Failed to leave group.");
    }
  };

  const handleDeleteGroup = async (groupId, gName) => {
    if (!window.confirm(`Are you sure you want to delete the community group "${gName}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "communities", groupId));
      toast.success(`Deleted ${gName} community.`);
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group: ", error);
      toast.error("Failed to delete group.");
    }
  };

  const filteredGroups = groups.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.groupName?.toLowerCase().includes(term) ||
      g.description?.toLowerCase().includes(term) ||
      g.location?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center font-body text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🔄</span>
          Loading community groups...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 mb-20">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-800">
            Community Sports Groups
          </h1>
          <p className="font-body text-base leading-relaxed text-slate-500 mt-1">
            Connect with dedicated local sport clubs and hobby communities near you.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="font-body font-semibold bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white py-3 px-6 rounded-xl shadow-lg transition duration-200 text-sm text-center"
        >
          {showCreateForm ? "Cancel Creation" : "➕ Create New Group"}
        </button>
      </div>

      {/* Creation Form Expansion */}
      {showCreateForm && (
        <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-6 rounded-3xl shadow-xl mb-10 max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-slate-800 mb-4">New Club Details</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="font-body block text-sm font-semibold text-slate-600 mb-1">Group Name *</label>
              <input
                type="text"
                placeholder="e.g. Swimming Club, Chess Club"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                required
              />
            </div>
            <div>
              <label className="font-body block text-sm font-semibold text-slate-600 mb-1">Description *</label>
              <textarea
                placeholder="Describe your group's goals, weekly playing schedules, or target age ranges..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                required
              />
            </div>
            <div>
              <label className="font-body block text-sm font-semibold text-slate-600 mb-1">Location *</label>
              <input
                type="text"
                placeholder="e.g. Technopark Ground, Central Park"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="font-body w-full font-semibold bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl shadow-md transition duration-200"
            >
              Launch Group
            </button>
          </form>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-[#FFF9F2]/80 backdrop-blur-sm border border-orange-100/50 p-4 rounded-2xl shadow mb-8 max-w-lg">
        <label className="font-body font-semibold block text-xs uppercase tracking-wider text-slate-500 mb-1">
          Search Groups
        </label>
        <input
          type="text"
          placeholder="Filter by name, description, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="font-body w-full border border-orange-100 p-3 bg-[#FFFDFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm shadow-sm"
        />
      </div>

      {/* Grid of Groups */}
      {filteredGroups.length === 0 ? (
        <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-3xl p-12 text-center shadow-lg">
          <span className="text-4xl">👥</span>
          <h3 className="font-heading text-xl font-semibold text-slate-800 mt-4">No Communities Found</h3>
          <p className="font-body text-base leading-relaxed text-slate-500 mt-2">
            Be the first to create a community sports group and invite others!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredGroups.map((group) => {
            const isMember = group.members?.includes(userId);
            const isCreator = group.createdBy === userId;

            return (
              <div
                key={group.id}
                className="bg-[#FFF9F2]/90 backdrop-blur-sm border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-slate-800 truncate" title={group.groupName}>
                      {group.groupName}
                    </h3>
                    <div className="flex gap-1.5">
                      {isCreator && (
                        <span className="font-body font-bold bg-orange-100 text-[#8E2F00] text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                          Owner
                        </span>
                      )}
                      {isMember && !isCreator && (
                        <span className="font-body font-bold bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                          Member
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-body text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-3">
                    <span>👥</span> {group.members?.length || 0} Member(s)
                  </p>

                  <p className="font-body text-sm leading-relaxed text-slate-600 mb-4 line-clamp-3" title={group.description}>
                    {group.description}
                  </p>

                  <p className="font-body text-sm text-slate-500 flex items-center gap-1.5">
                    <span>📍</span> <strong className="text-slate-700 font-semibold">Location:</strong> {group.location}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  {isCreator ? (
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.groupName)}
                      className="font-body font-semibold w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 px-4 rounded-xl transition duration-200 text-center text-sm"
                    >
                      🗑️ Delete Group
                    </button>
                  ) : isMember ? (
                    <button
                      onClick={() => handleLeaveGroup(group.id, group.groupName)}
                      className="font-body font-semibold w-full bg-orange-50 hover:bg-orange-100 text-orange-800 py-2.5 px-4 rounded-xl border border-orange-100/50 transition duration-200 text-center text-sm"
                    >
                      👋 Leave Group
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group.id, group.groupName)}
                      className="font-body font-semibold w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-4 rounded-xl shadow transition duration-200 text-center text-sm"
                    >
                      🤝 Join Group
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CommunityGroups;
