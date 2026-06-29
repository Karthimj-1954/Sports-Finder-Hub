import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

function Requests() {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("received"); // received or sent
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  const fetchData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      // 1. Fetch received requests
      const qReceived = query(collection(db, "requests"), where("receiverId", "==", uid));
      const receivedSnapshot = await getDocs(qReceived);
      const receivedList = receivedSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      receivedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setReceivedRequests(receivedList);

      // 2. Fetch sent requests
      const qSent = query(collection(db, "requests"), where("senderId", "==", uid));
      const sentSnapshot = await getDocs(qSent);
      const sentList = sentSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      sentList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setSentRequests(sentList);

      // 3. Fetch notifications feed (limit to 5)
      const qNotif = query(collection(db, "notifications"), where("userId", "==", uid));
      const notifSnapshot = await getDocs(qNotif);
      const notifList = notifSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      notifList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(notifList.slice(0, 5));

      // 4. Mark all unread notifications as read
      const qUnread = query(
        collection(db, "notifications"),
        where("userId", "==", uid),
        where("read", "==", false)
      );
      const unreadSnapshot = await getDocs(qUnread);
      for (const docSnap of unreadSnapshot.docs) {
        await updateDoc(doc(db, "notifications", docSnap.id), { read: true });
      }
    } catch (error) {
      console.error("Error fetching requests data: ", error);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [userId]);

  const updateStatus = async (requestId, status, request) => {
    const loadingToast = toast.loading(`Updating request to ${status}...`);
    try {
      // Update in Firestore requests collection
      await updateDoc(doc(db, "requests", requestId), { status });

      const receiverName = request.receiverEmail?.split("@")[0] || "Partner";
      const senderName = request.playerName || request.senderEmail?.split("@")[0] || "Player";

      // Trigger notifications for status updates
      if (status === "Accepted" || status === "Declined") {
        await addDoc(collection(db, "notifications"), {
          userId: request.senderId,
          message: `${receiverName} has ${status.toLowerCase()} your play request for ${request.game}.`,
          type: status.toLowerCase(),
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // If Completed or Cancelled, write to match history for BOTH users
      if (status === "Completed" || status === "Cancelled") {
        // Record for sender
        await addDoc(collection(db, "matches"), {
          userId: request.senderId,
          partnerName: receiverName,
          game: request.game,
          date: new Date().toLocaleDateString(),
          status: status,
          createdAt: new Date().toISOString(),
        });

        // Record for receiver
        await addDoc(collection(db, "matches"), {
          userId: request.receiverId,
          partnerName: senderName,
          game: request.game,
          date: new Date().toLocaleDateString(),
          status: status,
          createdAt: new Date().toISOString(),
        });
      }

      toast.dismiss(loadingToast);
      toast.success(`Request marked as ${status}!`);
      fetchData(); // Refresh lists
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error updating status: ", error);
      toast.error("Failed to update status.");
    }
  };

  const handleClearRequests = async () => {
    if (!window.confirm("Are you sure you want to clear all received requests?")) {
      return;
    }
    const loadingToast = toast.loading("Clearing requests...");
    try {
      for (const req of receivedRequests) {
        await deleteDoc(doc(db, "requests", req.id));
      }
      setReceivedRequests([]);
      toast.dismiss(loadingToast);
      toast.success("Received requests cleared successfully.");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error clearing requests: ", error);
      toast.error("Failed to clear requests.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-green-50 text-green-700 border-green-150";
      case "Declined":
        return "bg-red-50 text-red-700 border-red-150";
      case "Completed":
        return "bg-blue-50 text-blue-700 border-blue-150";
      case "Cancelled":
        return "bg-slate-50 text-slate-700 border-slate-150";
      default:
        return "bg-orange-50 text-orange-700 border-orange-150";
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading play requests..." />;
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 mb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-800">
            Play Requests Hub
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            Manage matching invitations and track your game invitation lifecycles.
          </p>
        </div>
        {activeTab === "received" && receivedRequests.length > 0 && (
          <button
            onClick={handleClearRequests}
            className="font-body font-semibold bg-red-600 hover:bg-red-700 text-white py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition duration-200 text-sm text-center cursor-pointer"
          >
            Clear Received Requests
          </button>
        )}
      </div>

      {/* Notifications Banner Feed */}
      {notifications.length > 0 && (
        <div className="bg-amber-50/40 border border-amber-100/50 p-5 rounded-3xl shadow-sm mb-8">
          <h3 className="font-heading text-base font-bold text-slate-700 mb-3">🔔 Recent Notifications</h3>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className="font-body text-xs text-slate-600 flex justify-between items-center py-1 border-b border-orange-50 last:border-0">
                <span>{notif.message}</span>
                <span className="text-slate-400 font-semibold">{notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-orange-100 mb-8">
        <button
          onClick={() => setActiveTab("received")}
          className={`font-body font-bold text-sm py-3 px-6 border-b-2 transition duration-250 ${
            activeTab === "received"
              ? "border-orange-600 text-orange-850"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          📥 Received Requests ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`font-body font-bold text-sm py-3 px-6 border-b-2 transition duration-250 ${
            activeTab === "sent"
              ? "border-orange-600 text-orange-850"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          📤 Sent Requests ({sentRequests.length})
        </button>
      </div>

      {/* Active Tab rendering */}
      {activeTab === "received" ? (
        receivedRequests.length === 0 ? (
          <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-3xl p-12 text-center shadow-lg">
            <span className="text-4xl">📬</span>
            <h3 className="font-heading text-xl font-semibold text-slate-800 mt-4">No Received Requests</h3>
            <p className="font-body text-base leading-relaxed text-slate-500 mt-2">
              You haven&apos;t received any game partner invitations yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {receivedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[#FFF9F2]/90 backdrop-blur-sm border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-slate-800 truncate" title={request.playerName || request.senderEmail}>
                      {request.playerName || request.senderEmail?.split("@")[0]}
                    </h3>
                    <span className={`font-body font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="font-body text-sm leading-relaxed space-y-2 text-slate-600">
                    <p>
                      🎮 <strong className="text-slate-700 font-semibold">Game:</strong> {request.game}
                    </p>
                    <p>
                      ⭐ <strong className="text-slate-700 font-semibold">Skill:</strong> {request.skill}
                    </p>
                    <p>
                      📍 <strong className="text-slate-700 font-semibold">Location:</strong> {request.location}
                    </p>
                    {request.createdAt && (
                      <p className="text-xs text-slate-400 mt-2">
                        ⏱ {new Date(request.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Receiver Actions */}
                <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-slate-100">
                  {request.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(request.id, "Accepted", request)}
                        className="font-body font-semibold flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl shadow transition duration-200 text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(request.id, "Declined", request)}
                        className="font-body font-semibold flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl shadow transition duration-200 text-xs"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {request.status === "Accepted" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(request.id, "Completed", request)}
                        className="font-body font-semibold flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl shadow transition duration-200 text-xs"
                      >
                        Complete Match
                      </button>
                      <button
                        onClick={() => updateStatus(request.id, "Cancelled", request)}
                        className="font-body font-semibold flex-1 bg-slate-500 hover:bg-slate-650 text-white py-2 rounded-xl shadow transition duration-200 text-xs"
                      >
                        Cancel Match
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        sentRequests.length === 0 ? (
          <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-3xl p-12 text-center shadow-lg">
            <span className="text-4xl">📤</span>
            <h3 className="font-heading text-xl font-semibold text-slate-800 mt-4">No Sent Requests</h3>
            <p className="font-body text-base leading-relaxed text-slate-500 mt-2">
              You haven&apos;t sent any game invitations yet. Head to &quot;Find Partners&quot; to send some!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[#FFF9F2]/90 backdrop-blur-sm border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-slate-800 truncate">
                      To: {request.receiverEmail?.split("@")[0]}
                    </h3>
                    <span className={`font-body font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="font-body text-sm leading-relaxed space-y-2 text-slate-600">
                    <p>
                      🎮 <strong className="text-slate-700 font-semibold">Game:</strong> {request.game}
                    </p>
                    <p>
                      ⭐ <strong className="text-slate-700 font-semibold">Skill:</strong> {request.skill}
                    </p>
                    <p>
                      📍 <strong className="text-slate-700 font-semibold">Location:</strong> {request.location}
                    </p>
                    {request.createdAt && (
                      <p className="text-xs text-slate-400 mt-2">
                        ⏱ {new Date(request.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sender Actions: can mark as complete/cancel if receiver accepted */}
                <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-slate-100">
                  {request.status === "Accepted" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(request.id, "Completed", request)}
                        className="font-body font-semibold flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl shadow transition duration-200 text-xs"
                      >
                        Complete Match
                      </button>
                      <button
                        onClick={() => updateStatus(request.id, "Cancelled", request)}
                        className="font-body font-semibold flex-1 bg-slate-500 hover:bg-slate-650 text-white py-2 rounded-xl shadow transition duration-200 text-xs"
                      >
                        Cancel Match
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default Requests;