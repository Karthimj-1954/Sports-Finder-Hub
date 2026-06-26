import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

function SessionManager() {
  const navigate = useNavigate();

  useEffect(() => {
    let checkInterval = null;

    const checkSession = async (user) => {
      if (!user) return;
      const userId = user.uid;
      const loginTimeStr = localStorage.getItem(`loginTime_${userId}`);
      
      if (loginTimeStr) {
        const loginTime = parseInt(loginTimeStr, 10);
        const elapsed = Date.now() - loginTime;
        
        if (elapsed >= 1800000) { // 30 minutes
          // Clear interval and observer first to prevent duplicate alerts
          if (checkInterval) clearInterval(checkInterval);
          
          localStorage.removeItem(`loginTime_${userId}`);
          try {
            await signOut(auth);
            alert("Your session has expired. Please login again.");
            navigate("/login", { replace: true });
          } catch (err) {
            console.error("Error signing out:", err);
          }
        }
      } else {
        // Initialize if logged in but timestamp doesn't exist yet
        localStorage.setItem(`loginTime_${userId}`, Date.now().toString());
      }
    };

    // Listen to Firebase auth changes to check immediately on mount
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkSession(user);
      }
    });

    // Check periodically every minute
    checkInterval = setInterval(() => {
      const user = auth.currentUser;
      if (user) {
        checkSession(user);
      }
    }, 60000);

    return () => {
      unsubscribe();
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [navigate]);

  return null;
}

export default SessionManager;
