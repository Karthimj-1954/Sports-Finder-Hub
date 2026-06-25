import Navbar from "../components/Navbar";

function Home() {
    const matches =
        JSON.parse(localStorage.getItem("matches")) || [];

    const players =
        JSON.parse(localStorage.getItem("players")) || [];

    const requests =
        JSON.parse(localStorage.getItem("requests")) || [];

    const acceptedPlayers =
        JSON.parse(localStorage.getItem("acceptedPlayers")) || [];

    const totalPlayers = players.length;
    const totalMatches = matches.length;
    const totalRequests = requests.length;
    const totalAccepted = acceptedPlayers.length;

    return (
        <>
            <Navbar />

            {/* Hero Section */}
            <div className="text-center mt-20">
                <h1 className="text-6xl font-bold text-blue-600">
                    Sports Finder
                </h1>

                <h2 className="text-3xl font-semibold mt-4">
                    Find Sports Partners Near You
                </h2>

                <p className="mt-4 text-gray-600">
                    Connect with local players and join games.
                </p>
            </div>

            {/* Dashboard Statistics */}
            <div className="max-w-6xl mx-auto mt-16 px-4">
                <div className="grid md:grid-cols-4 gap-6">

                    <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                        <h3 className="text-4xl font-bold text-blue-600">
                            {totalPlayers}
                        </h3>
                        <p className="text-gray-600 mt-2">
                            Total Players
                        </p>
                    </div>

                    <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                        <h3 className="text-4xl font-bold text-green-600">
                            {totalMatches}
                        </h3>
                        <p className="text-gray-600 mt-2">
                            Total Matches
                        </p>
                    </div>

                    <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                        <h3 className="text-4xl font-bold text-red-600">
                            {totalRequests}
                        </h3>
                        <p className="text-gray-600 mt-2">
                            Total Requests
                        </p>
                    </div>

                    <div className="bg-white shadow-lg rounded-xl p-6 text-center">
                        <h3 className="text-4xl font-bold text-purple-600">
                            {totalAccepted}
                        </h3>
                        <p className="text-gray-600 mt-2">
                            Accepted
                        </p>
                    </div>

                </div>
            </div>

            {/* Nearby Players */}
            <div className="max-w-6xl mx-auto mt-20 px-4 mb-20">
                <h2 className="text-3xl font-bold text-center mb-10">
                    Nearby Players
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {players.length === 0 ? (
                        <p>No players added yet.</p>
                    ) : (
                        players.map((player, index) => (
                            <div
                                key={index}
                                className="bg-white shadow rounded-xl p-5"
                            >
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
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Upcoming Matches */}
            <div className="max-w-6xl mx-auto mt-20 px-4 mb-20">
                <h2 className="text-3xl font-bold text-center mb-10">
                    Upcoming Matches
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {matches.length === 0 ? (
                        <p>No matches available</p>
                    ) : (
                        matches.map((match, index) => (
                            <div
                                key={index}
                                className="bg-white shadow rounded-xl p-5"
                            >
                                <h3 className="text-xl font-bold">
                                    {match.title}
                                </h3>

                                <p>🏆 {match.sport}</p>
                                <p>📍 {match.location}</p>
                                <p>📅 {match.date}</p>
                                <p>⏰ {match.time}</p>

                                <button
                                    onClick={() => {
                                        const updatedMatches =
                                            matches.filter((_, i) => i !== index);

                                        localStorage.setItem(
                                            "matches",
                                            JSON.stringify(updatedMatches)
                                        );

                                        window.location.reload();
                                    }}
                                    className="bg-red-600 text-white px-4 py-2 rounded mt-5 block"
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export default Home;