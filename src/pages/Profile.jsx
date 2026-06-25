import { useState } from "react";
import LocationPicker from "../components/LocationPicker";

function Profile() {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const requests =
    JSON.parse(localStorage.getItem("requests")) || [];

  const acceptedPlayers =
    JSON.parse(localStorage.getItem("acceptedPlayers")) || [];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const savePlayer = () => {
    if (!name || !sport || !location) {
      alert("Please fill name, sport, and location.");
      return;
    }

    const player = {
      name,
      sport,
      location,
      image,
      latitude,
      longitude,
    };

    const players =
      JSON.parse(localStorage.getItem("players")) || [];

    players.push(player);

    localStorage.setItem("players", JSON.stringify(players));

    alert("Player saved successfully!");

    setName("");
    setSport("");
    setLocation("");
    setImage("");
    setLatitude("");
    setLongitude("");
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-10">
        My Profile
      </h1>

      {/* Add Player Section */}
      <div className="bg-white shadow rounded-xl p-6 mb-10">
        <h2 className="text-2xl font-bold mb-4">
          Add Player
        </h2>

        <input
          type="text"
          placeholder="Player Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 rounded w-full mb-3"
        />

        <input
          type="text"
          placeholder="Sport"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="border p-3 rounded w-full mb-3"
        />

        <input
          type="text"
          placeholder="Location Name"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border p-3 rounded w-full mb-3"
        />

        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
        />

        {/* Upload Box */}
        <label className="border-2 border-dashed border-blue-400 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 mb-4">
          {image ? (
            <>
              <img
                src={image}
                alt="Player Preview"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
              <span className="text-sm text-gray-500">
                Click to change photo
              </span>
            </>
          ) : (
            <span className="text-gray-600">
              📷 Click to Upload Player Photo
            </span>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={savePlayer}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Player
        </button>
      </div>

      {/* Connection Requests */}
      <h2 className="text-2xl font-bold mb-6">
        Connection Requests
      </h2>

      {requests.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500">
            No connection requests yet.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {requests.map((request, index) => (
            <div
              key={index}
              className="bg-white shadow rounded-xl p-5"
            >
              <h3 className="text-xl font-bold">
                {request.player}
              </h3>

              <p>🏆 {request.sport}</p>
              <p>📍 {request.location}</p>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    const accepted =
                      JSON.parse(
                        localStorage.getItem("acceptedPlayers")
                      ) || [];

                    accepted.push(request);

                    localStorage.setItem(
                      "acceptedPlayers",
                      JSON.stringify(accepted)
                    );

                    const updatedRequests =
                      requests.filter((_, i) => i !== index);

                    localStorage.setItem(
                      "requests",
                      JSON.stringify(updatedRequests)
                    );

                    window.location.reload();
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => {
                    const updatedRequests =
                      requests.filter((_, i) => i !== index);

                    localStorage.setItem(
                      "requests",
                      JSON.stringify(updatedRequests)
                    );

                    window.location.reload();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accepted Connections */}
      <h2 className="text-2xl font-bold mt-10 mb-6">
        Accepted Connections
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {acceptedPlayers.length === 0 ? (
          <p>No accepted connections yet.</p>
        ) : (
          acceptedPlayers.map((player, index) => (
            <div
              key={index}
              className="bg-white shadow rounded-xl p-5"
            >
              <h3 className="text-xl font-bold">
                {player.player}
              </h3>

              <p>🏆 {player.sport}</p>
              <p>📍 {player.location}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Profile;