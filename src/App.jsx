import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";

import sportsBg from "./assets/sports/sports-bg.png";
import LocationPicker from "./components/LocationPicker";
import ProtectedRoute from "./components/ProtectedRoute";
import { auth } from "./firebase";

import AuthHome from "./pages/AuthHome";
import FindPartner from "./pages/FindPartner";
import Login from "./pages/Login";
import PlayerDetails from "./pages/PlayerDetails";
import Register from "./pages/Register";

function addNotification(message) {
  const notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

  notifications.push({
    message,
    time: new Date().toLocaleString(),
  });

  localStorage.setItem(
    "notifications",
    JSON.stringify(notifications)
  );
}

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      navigate("/login", { replace: true });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <nav className="bg-blue-600 text-white p-5 flex justify-between items-center">
      <h1 className="text-2xl font-bold">
        <Link to="/">Sports Finder</Link>
      </h1>

      <div className="space-x-6 flex items-center">
        <Link to="/">Home</Link>
        <Link to="/partner">Find Partner</Link>
        <Link to="/create">Create Match</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/notifications">Notifications</Link>

        <button
          onClick={handleLogout}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function PageLayout({ children }) {
  return (
    <div
      className="min-h-screen"
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
      <Navbar />
      <div className="min-h-screen pb-20">{children}</div>
    </div>
  );
}

function Home() {
  const animations = [
    { sport: "Football", emoji: "⚽", text: "GOAL!" },
    { sport: "Cricket", emoji: "🏏", text: "SIXER!" },
    { sport: "Basketball", emoji: "🏀", text: "SWISH!" },
    { sport: "Badminton", emoji: "🏸", text: "SMASH!" },
    { sport: "Volleyball", emoji: "🏐", text: "SPIKE!" },
    { sport: "Tennis", emoji: "🎾", text: "ACE!" },
  ];

  const [welcomeSport, setWelcomeSport] = useState(animations[0]);

  useEffect(() => {
    const randomIndex =
      Math.floor(Math.random() * animations.length);

    setWelcomeSport(animations[randomIndex]);
  }, []);

  const matches =
    JSON.parse(localStorage.getItem("matches")) || [];

  const players =
    JSON.parse(localStorage.getItem("players")) || [];

  const requests =
    JSON.parse(localStorage.getItem("requests")) || [];

  const acceptedPlayers =
    JSON.parse(localStorage.getItem("acceptedPlayers")) || [];

  const joinedMatches =
    JSON.parse(localStorage.getItem("joinedMatches")) || [];

  const totalPlayers = players.length;
  const totalMatches = matches.length;
  const totalRequests = requests.length;
  const totalAccepted = acceptedPlayers.length;
  const totalJoinedMatches = joinedMatches.length;

  const cardClass =
    "bg-white/90 text-black shadow rounded-xl p-5 backdrop-blur";

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto pt-10 px-4">
        <h1 className="text-5xl font-bold text-center text-blue-600">
          Sports Finder
        </h1>

        <p className="text-gray-700 text-center mt-4">
          Connect with players, create matches, and grow your sports community.
        </p>

        <div className="welcome-box mt-12">
          <h2 className="text-4xl font-bold mb-6">
            Welcome to Sports Finder
          </h2>

          <div className="sport-animation">
            <div className="moving-ball">
              {welcomeSport.emoji}
            </div>

            <h1 className="animation-text">
              {welcomeSport.text}
            </h1>
          </div>

          <p className="mt-4 text-xl">
            Today's Sport: {welcomeSport.sport}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mt-12">
          <div className={cardClass}>
            <h3 className="text-4xl font-bold text-blue-600">
              {totalPlayers}
            </h3>
            <p>Total Players</p>
          </div>

          <div className={cardClass}>
            <h3 className="text-4xl font-bold text-green-600">
              {totalMatches}
            </h3>
            <p>Total Matches</p>
          </div>

          <div className={cardClass}>
            <h3 className="text-4xl font-bold text-red-600">
              {totalRequests}
            </h3>
            <p>Total Requests</p>
          </div>

          <div className={cardClass}>
            <h3 className="text-4xl font-bold text-purple-600">
              {totalAccepted}
            </h3>
            <p>Accepted</p>
          </div>

          <div className={cardClass}>
            <h3 className="text-4xl font-bold text-orange-600">
              {totalJoinedMatches}
            </h3>
            <p>Joined Matches</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mt-16 mb-8">
          Nearby Players
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {players.length === 0 ? (
            <p>No players added yet.</p>
          ) : (
            players.map((player, index) => (
              <div key={index} className={cardClass}>
                {player.image && (
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-20 h-20 rounded-full object-cover mb-4"
                  />
                )}

                <h3 className="font-bold text-xl">
                  {player.name}
                </h3>

                <p>🏆 {player.sport}</p>
                <p>📍 {player.location}</p>

                <Link
                  to={`/player/${index}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded mt-4 inline-block"
                >
                  View Profile
                </Link>
              </div>
            ))
          )}
        </div>

        <h2 className="text-3xl font-bold text-center mt-16 mb-8">
          Upcoming Matches
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {matches.length === 0 ? (
            <p>No matches available</p>
          ) : (
            matches.map((match, index) => (
              <div key={index} className={cardClass}>
                <h3 className="text-xl font-bold">
                  {match.title}
                </h3>

                <p>🏆 {match.sport}</p>
                <p>📍 {match.location}</p>
                <p>📅 {match.date}</p>
                <p>⏰ {match.time}</p>

                <button
                  onClick={() => {
                    const joined =
                      JSON.parse(
                        localStorage.getItem("joinedMatches")
                      ) || [];

                    const alreadyJoined = joined.some(
                      (item) =>
                        item.title === match.title &&
                        item.date === match.date &&
                        item.time === match.time
                    );

                    if (alreadyJoined) {
                      alert("You already joined this match!");
                      return;
                    }

                    joined.push(match);

                    localStorage.setItem(
                      "joinedMatches",
                      JSON.stringify(joined)
                    );

                    addNotification(`You joined ${match.title}`);

                    alert(`Joined ${match.title}`);
                    window.location.reload();
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded mt-4 mr-2"
                >
                  Join Match
                </button>

                <button
                  onClick={() => {
                    const updatedMatches =
                      matches.filter((_, i) => i !== index);

                    localStorage.setItem(
                      "matches",
                      JSON.stringify(updatedMatches)
                    );

                    addNotification(`${match.title} match deleted`);

                    window.location.reload();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded mt-4"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <h2 className="text-3xl font-bold text-center mt-16 mb-8">
          Joined Matches
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {joinedMatches.length === 0 ? (
            <p>No joined matches yet.</p>
          ) : (
            joinedMatches.map((match, index) => (
              <div key={index} className={cardClass}>
                <h3 className="text-xl font-bold">
                  {match.title}
                </h3>

                <p>🏆 {match.sport}</p>
                <p>📍 {match.location}</p>
                <p>📅 {match.date}</p>
                <p>⏰ {match.time}</p>

                <button
                  onClick={() => {
                    const updatedJoinedMatches =
                      joinedMatches.filter(
                        (_, i) => i !== index
                      );

                    localStorage.setItem(
                      "joinedMatches",
                      JSON.stringify(updatedJoinedMatches)
                    );

                    addNotification(`You left ${match.title}`);

                    window.location.reload();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded mt-4"
                >
                  Leave Match
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function CreateMatch() {
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Football");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const matches =
      JSON.parse(localStorage.getItem("matches")) || [];

    matches.push({
      title,
      sport,
      location,
      date,
      time,
    });

    localStorage.setItem("matches", JSON.stringify(matches));

    addNotification(`New match created: ${title}`);

    alert("Match created successfully!");

    setTitle("");
    setSport("Football");
    setLocation("");
    setDate("");
    setTime("");
  };

  return (
    <PageLayout>
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white/90 rounded-xl shadow backdrop-blur">
        <h1 className="text-3xl font-bold mb-6">
          Create Match
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Match Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full border p-3 rounded"
          >
            <option>Football</option>
            <option>Cricket</option>
            <option>Badminton</option>
            <option>Basketball</option>
          </select>

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >
            Create Match
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

function Profile() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [sport, setSport] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState("");
  const [achievement, setAchievement] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [image, setImage] = useState("");

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
    const players =
      JSON.parse(localStorage.getItem("players")) || [];

    players.push({
      name,
      age,
      gender,
      sport,
      skill,
      location,
      about,
      experience,
      achievement,
      phone,
      instagram,
      image,
    });

    localStorage.setItem("players", JSON.stringify(players));

    addNotification(`${name} player profile added`);

    alert("Player saved successfully!");

    setName("");
    setAge("");
    setGender("");
    setSport("");
    setSkill("");
    setLocation("");
    setAbout("");
    setExperience("");
    setAchievement("");
    setPhone("");
    setInstagram("");
    setImage("");
  };

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <h1 className="text-4xl font-bold text-center mb-10">
          My Profile
        </h1>

        <div className="bg-white/90 shadow rounded-xl p-6 mb-10 backdrop-blur">
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
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

          <input
            type="text"
            placeholder="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
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
            placeholder="Skill Level"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

          <LocationPicker
            location={location}
            setLocation={setLocation}
          />

          <textarea
            placeholder="About Me"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

          <input
            type="text"
            placeholder="Experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

          <input
            type="text"
            placeholder="Achievement"
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

          <input
            type="text"
            placeholder="Instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />

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
      </div>
    </PageLayout>
  );
}

function Notifications() {
  const notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto mt-10 px-4">
        <h1 className="text-3xl font-bold mb-6">
          Notifications
        </h1>

        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          notifications.map((note, index) => (
            <div
              key={index}
              className="bg-white/90 shadow p-4 rounded mb-3 backdrop-blur"
            >
              <p>{note.message}</p>
              <p className="text-gray-500 text-sm">
                {note.time}
              </p>
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/auth"
        element={
          <ProtectedRoute>
            <AuthHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/partner"
        element={
          <ProtectedRoute>
            <FindPartner />
          </ProtectedRoute>
        }
      />

      <Route
        path="/player/:id"
        element={
          <ProtectedRoute>
            <PlayerDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateMatch />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;