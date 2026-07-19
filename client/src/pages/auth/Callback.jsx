import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { PageLoader } from "../../components/common/ui";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/http/api";
import { homeForRole } from "../../lib/roles";

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (!token) {
      toast.error("Google sign-in failed. Please try again.");
      navigate("/login?error=google_failed", { replace: true });
      return;
    }

    localStorage.setItem("accessToken", token);
    api.get("/auth/me")
      .then(({ data }) => {
        login(data);
        toast.success("Welcome to EkSaha.");
        navigate(homeForRole(data.role || role), { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        toast.error("Google sign-in failed. Please try again.");
        navigate("/login?error=google_failed", { replace: true });
      });
  }, [searchParams, navigate, login]);

  return <PageLoader/>;
}
