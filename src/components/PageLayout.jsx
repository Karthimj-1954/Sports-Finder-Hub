import Navbar from "./Navbar";
import sportsBg from "../assets/sports/sports-bg.png";

function PageLayout({ children, showNavbar = true }) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(255,255,255,0.75),
            rgba(255,255,255,0.75)
          ),
          url(${sportsBg})
        `,
        backgroundSize: "cover",
        backgroundRepeat: "repeat-y",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {showNavbar && <Navbar />}

      <div className="min-h-screen">
        {children}
      </div>
    </div>
  );
}

export default PageLayout;