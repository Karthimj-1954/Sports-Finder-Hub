import Navbar from "./Navbar";

function PageLayout({ children, showNavbar = true }) {
  return (
    <div
      className="min-h-screen pb-10"
      style={{
        background: "linear-gradient(135deg, #FFFDFB 0%, #FFE9D6 100%)",
      }}
    >
      {showNavbar && <Navbar />}

      <div>
        {children}
      </div>
    </div>
  );
}

export default PageLayout;