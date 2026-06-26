import { useState } from "react";
import { auth } from "../firebase";

function Requests() {
  const userId = auth.currentUser?.uid;
  console.log("Current User:", userId);

  const [requests, setRequests] = useState(() => {
    const uid = auth.currentUser?.uid;
    return JSON.parse(localStorage.getItem(`requests_${uid}`)) || [];
  });

  const updateStatus = (index, status) => {
    const uid = auth.currentUser?.uid;
    const updatedRequests = [...requests];
    updatedRequests[index].status = status;
    
    localStorage.setItem(`requests_${uid}`, JSON.stringify(updatedRequests));
    setRequests(updatedRequests);
    alert(`Request ${status} successfully!`);
  };

  const handleClearRequests = () => {
    if (window.confirm("Are you sure you want to clear all requests?")) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        localStorage.removeItem(`requests_${uid}`);
        localStorage.removeItem(`acceptedRequests_${uid}`);
        localStorage.removeItem(`notifications_${uid}`);
      }
      setRequests([]);
      alert("All requests cleared successfully.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-green-50 text-green-700 border-green-100";
      case "Declined":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-orange-50 text-orange-700 border-orange-100";
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-800">
            Play Requests
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            Respond to invitations and play requests sent by other game partners.
          </p>
        </div>
        <div>
          <button
            onClick={handleClearRequests}
            className="font-body font-semibold bg-red-600 hover:bg-red-700 text-white py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition duration-200 text-sm text-center"
          >
            Clear All Requests
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-[#FFF9F2]/80 border border-orange-100 rounded-3xl p-12 text-center shadow-lg">
          <span className="text-4xl">📬</span>
          <h3 className="font-heading text-xl font-semibold text-slate-800 mt-4">No Requests Found</h3>
          <p className="font-body text-base leading-relaxed text-slate-500 mt-2">You haven&apos;t received or sent any play requests yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {requests.map((request, index) => (
            <div
              key={index}
              className="bg-[#FFF9F2]/90 backdrop-blur-sm border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-xl font-semibold text-slate-800 truncate">
                    {request.player}
                  </h3>
                  <span className={`font-body font-semibold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                <div className="font-body text-base leading-relaxed space-y-2 text-slate-600">
                  <p className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium w-5 text-center">🎮</span>
                    <strong className="text-slate-700 font-semibold">Game:</strong> {request.game}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium w-5 text-center">⭐</span>
                    <strong className="text-slate-700 font-semibold">Skill:</strong> {request.skill}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium w-5 text-center">📍</span>
                    <strong className="text-slate-700 font-semibold">Location:</strong> {request.location}
                  </p>
                  {request.time && (
                    <p className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      <span className="font-medium w-5 text-center">⏱</span>
                      {request.time}
                    </p>
                  )}
                </div>
              </div>

              {request.status === "Pending" && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => updateStatus(index, "Accepted")}
                    className="font-body font-semibold flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl shadow transition duration-200 text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(index, "Declined")}
                    className="font-body font-semibold flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl shadow transition duration-200 text-sm"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Requests;