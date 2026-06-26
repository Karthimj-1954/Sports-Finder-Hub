import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./leafletIcon";

// Clear legacy shared data once on app startup
localStorage.removeItem("players");
localStorage.removeItem("requests");
localStorage.removeItem("acceptedRequests");
localStorage.removeItem("notifications");
localStorage.removeItem("playRequests");
localStorage.removeItem("matches");

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);