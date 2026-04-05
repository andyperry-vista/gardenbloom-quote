import { Navigate } from "react-router-dom";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAdmin = sessionStorage.getItem("mayura_admin") === "true";
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
