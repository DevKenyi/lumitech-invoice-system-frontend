import { Navigate, useLocation } from "react-router-dom";
import { getUserFromToken } from "../services/api";

// Routes that staff (expense-only) users are allowed to visit
const STAFF_ALLOWED = ["/expenses", "/expenses/manage", "/expenses/claims", "/staff-home", "/settings/org", "/pos", "/pos/food", "/orders"];

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getUserFromToken();
  const role = user?.role;
  const isStaff = role === "STAFF" || role === "STAFF_EXPENSE";

  if (isStaff) {
    const allowed = STAFF_ALLOWED.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
    if (!allowed) {
      return <Navigate to="/staff-home" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
