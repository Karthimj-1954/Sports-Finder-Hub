import { useParams, Link } from "react-router-dom";

function PlayerDetails() {
  const { id } = useParams();

  const players = JSON.parse(localStorage.getItem("players")) || [];
  const player = players[id];

  if (!player) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-[#FFF9F2]/90 rounded-3xl shadow-xl text-center">
        <h1 className="font-heading text-2xl font-bold text-slate-800">Player Not Found</h1>
        <p className="font-body text-base leading-relaxed text-slate-500 mt-2">The player profile you are looking for does not exist or has been removed.</p>
        <Link to="/" className="mt-6 inline-block bg-orange-600 hover:bg-orange-700 text-white font-body font-semibold py-2.5 px-6 rounded-xl transition">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 px-4 mb-20">
      <div className="mb-6">
        <Link to="/" className="font-body text-sm font-semibold text-[#8E2F00] hover:text-[#ff6d00] bg-orange-50 px-3 py-1.5 rounded-lg transition">
          &larr; Back to Home
        </Link>
      </div>

      <div className="bg-[#FFF9F2]/90 backdrop-blur-md border border-orange-100/50 p-8 rounded-3xl shadow-2xl text-slate-800">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner border border-orange-100">
            🏃
          </div>
          <h1 className="font-heading text-3xl font-bold text-slate-800 tracking-tight">{player.name}</h1>
          <span className="font-body bg-orange-50 text-orange-700 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-orange-100 mt-2">
            {player.skill} Level
          </span>
        </div>

        <hr className="border-orange-100/30 my-6" />

        <div className="space-y-4 font-body text-base">
          <div className="flex items-center gap-3">
            <span className="text-xl bg-orange-50 p-2 rounded-xl text-[#8E2F00] w-10 h-10 flex items-center justify-center">🎮</span>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preferred Game</p>
              <p className="text-slate-700 font-semibold">{player.game || player.sport}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl bg-orange-50 p-2 rounded-xl text-[#8E2F00] w-10 h-10 flex items-center justify-center">📍</span>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Playing Location</p>
              <p className="text-slate-700 font-semibold">{player.location} ({player.locationType || "Local Court"})</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl bg-orange-50 p-2 rounded-xl text-[#8E2F00] w-10 h-10 flex items-center justify-center">🗓️</span>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Availability Days</p>
              <p className="text-slate-700 font-semibold">{player.availabilityDay || "Not Specified"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl bg-orange-50 p-2 rounded-xl text-[#8E2F00] w-10 h-10 flex items-center justify-center">⏰</span>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preferred Time</p>
              <p className="text-slate-700 font-semibold">{player.availabilityTime || "Not Specified"}</p>
            </div>
          </div>
        </div>

        {player.about && (
          <>
            <hr className="border-orange-100/30 my-6" />
            <div>
              <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About Player</p>
              <p className="font-body text-slate-600 leading-relaxed text-sm bg-orange-50/20 border border-orange-100/20 rounded-2xl p-4">
                {player.about}
              </p>
            </div>
          </>
        )}

        {/* Render legacy details only if they exist in imported/old profiles */}
        {(player.age || player.gender || player.experience || player.achievement || player.phone || player.instagram) && (
          <>
            <hr className="border-orange-100/30 my-6" />
            <div className="grid grid-cols-2 gap-4 font-body text-sm">
              {player.age && <p><strong className="text-slate-500 font-semibold">Age:</strong> {player.age}</p>}
              {player.gender && <p><strong className="text-slate-500 font-semibold">Gender:</strong> {player.gender}</p>}
              {player.experience && <p><strong className="text-slate-500 font-semibold">Experience:</strong> {player.experience}</p>}
              {player.achievement && <p><strong className="text-slate-500 font-semibold">Achievement:</strong> {player.achievement}</p>}
              {player.phone && <p><strong className="text-slate-500 font-semibold">Phone:</strong> {player.phone}</p>}
              {player.instagram && <p><strong className="text-slate-500 font-semibold">Instagram:</strong> @{player.instagram}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PlayerDetails;