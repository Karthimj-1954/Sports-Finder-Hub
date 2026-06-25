import { useParams } from "react-router-dom";

function PlayerDetails() {
  const { id } = useParams();

  const players =
    JSON.parse(localStorage.getItem("players")) || [];

  const player = players[id];

  if (!player) {
    return (
      <h1 className="text-center mt-20 text-3xl font-bold">
        Player not found
      </h1>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      {player.image && (
        <img
          src={player.image}
          alt={player.name}
          className="w-32 h-32 rounded-full object-cover mb-4"
        />
      )}

      <h1 className="text-3xl font-bold">{player.name}</h1>

      <p className="mt-3">Age: {player.age}</p>
      <p>Gender: {player.gender}</p>
      <p>🏆 Sport: {player.sport}</p>
      <p>Skill: {player.skill}</p>
      <p>📍 Location: {player.location}</p>
      <p className="mt-3">About: {player.about}</p>

      <hr className="my-4" />

      <p>⏳ Experience: {player.experience}</p>
      <p>🏅 Achievement: {player.achievement}</p>
      <p>📞 Phone: {player.phone}</p>
      <p>📷 Instagram: @{player.instagram}</p>
    </div>
  );
}

export default PlayerDetails;