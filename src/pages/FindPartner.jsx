import { useState } from "react";
import { Link } from "react-router-dom";
import sportsBg from "../assets/sports/sports-bg.png";

function FindPartner() {
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");

  const players =
    JSON.parse(localStorage.getItem("players")) || [];

  const filteredPlayers = players.filter((player) => {
    const matchesSport =
      sport === "" || player.sport === sport;

    const matchesSearch =
      player.name
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesSport && matchesSearch;
  });

  const editPlayer = (index) => {
    const newName = prompt(
      "Enter new name",
      players[index].name
    );

    if (!newName) return;

    players[index].name = newName;

    localStorage.setItem(
      "players",
      JSON.stringify(players)
    );

    window.location.reload();
  };

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(255,255,255,0.78),
            rgba(255,255,255,0.78)
          ),
          url(${sportsBg})
        `,
        backgroundSize: "cover",
        backgroundRepeat: "repeat-y",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Find Sports Partners
        </h1>

        <div className="mb-8 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search Player"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-3 rounded w-full md:w-64 bg-white/90"
          />

          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="border p-3 rounded w-full md:w-64 bg-white/90"
          >
            <option value="">All Sports</option>
            <option value="Football">Football</option>
            <option value="Cricket">Cricket</option>
            <option value="Badminton">Badminton</option>
            <option value="Basketball">Basketball</option>
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {filteredPlayers.length === 0 ? (
            <div className="bg-white/90 backdrop-blur shadow rounded-xl p-6 text-center md:col-span-3">
              <p className="text-gray-600">
                No players found.
              </p>
            </div>
          ) : (
            filteredPlayers.map((player, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur shadow rounded-xl p-5"
              >
                <img
                  src={
                    player.image ||
                    "https://via.placeholder.com/80"
                  }
                  alt={player.name}
                  className="w-20 h-20 rounded-full object-cover mb-4"
                />

                <h3 className="text-xl font-bold">
                  {player.name}
                </h3>

                <p>🏆 {player.sport}</p>
                <p>📍 {player.location}</p>

                <Link
                  to={`/player/${index}`}
                  className="text-blue-600 font-semibold block mt-2"
                >
                  View Profile
                </Link>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => {
                      const requests =
                        JSON.parse(
                          localStorage.getItem("requests")
                        ) || [];

                      requests.push({
                        player: player.name,
                        sport: player.sport,
                        location: player.location,
                      });

                      localStorage.setItem(
                        "requests",
                        JSON.stringify(requests)
                      );

                      alert(
                        `Request sent to ${player.name}`
                      );
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Connect
                  </button>

                  <button
                    onClick={() => editPlayer(index)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      const updatedPlayers =
                        players.filter((_, i) => i !== index);

                      localStorage.setItem(
                        "players",
                        JSON.stringify(updatedPlayers)
                      );

                      window.location.reload();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FindPartner;