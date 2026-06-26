import { useState } from "react";

function AdminDashboard() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem("players")) || []);
  const requests = JSON.parse(localStorage.getItem("requests")) || [];
  const playRequests = JSON.parse(localStorage.getItem("playRequests")) || [];

  const deletePlayer = (index) => {
    if (window.confirm("Are you sure you want to delete this player profile?")) {
      const updatedPlayers = [...players];
      updatedPlayers.splice(index, 1);
      localStorage.setItem("players", JSON.stringify(updatedPlayers));
      setPlayers(updatedPlayers);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-800">
          Admin Dashboard
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Review community metrics and manage registered player profiles.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#FFF9F2]/80 backdrop-blur-md border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
              <h3 className="font-heading text-4xl font-bold text-orange-600 mt-2">{players.length}</h3>
            </div>
            <span className="text-3xl bg-orange-50 p-3 rounded-2xl text-orange-600">👥</span>
          </div>
        </div>

        <div className="bg-[#FFF9F2]/80 backdrop-blur-md border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wider">Play Requests</p>
              <h3 className="font-heading text-4xl font-bold text-orange-600 mt-2">{requests.length}</h3>
            </div>
            <span className="text-3xl bg-orange-50 p-3 rounded-2xl text-orange-600">📩</span>
          </div>
        </div>

        <div className="bg-[#FFF9F2]/80 backdrop-blur-md border border-orange-100/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Play Posts</p>
              <h3 className="font-heading text-4xl font-bold text-orange-600 mt-2">{playRequests.length}</h3>
            </div>
            <span className="text-3xl bg-orange-50 p-3 rounded-2xl text-orange-600">🏟️</span>
          </div>
        </div>
      </div>

      {/* Registered Players List */}
      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 rounded-3xl shadow-xl p-6 mb-20">
        <h2 className="font-heading text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <span>📋</span> Registered Players
        </h2>

        {players.length === 0 ? (
          <div className="font-body text-center py-8 text-slate-500 font-medium">
            No registered players found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 font-body text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4">Preferred Game</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Location Type</th>
                  <th className="py-4 px-4">Skill</th>
                  <th className="py-4 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm text-slate-700 divide-y divide-orange-50">
                {players.map((player, index) => (
                  <tr key={index} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-4 font-bold text-slate-800">{player.name}</td>
                    <td className="py-4 px-4">{player.game || player.sport}</td>
                    <td className="py-4 px-4">{player.location}</td>
                    <td className="py-4 px-4">{player.locationType || "Local Court"}</td>
                    <td className="py-4 px-4">
                      <span className="font-body font-semibold bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-100">
                        {player.skill}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => deletePlayer(index)}
                        className="font-body font-semibold bg-red-50 hover:bg-red-100 text-red-600 py-1 px-3 rounded-lg text-xs transition duration-200"
                      >
                        Delete Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;