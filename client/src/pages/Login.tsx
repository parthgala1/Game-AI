import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { LoginFormData, UserData } from "@/types/user.types";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { NODE_SERVER_URL } from "@/constants/utils";

const LoginPage = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    if (userData?.userId) {
      navigate("/");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${NODE_SERVER_URL}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("userData", JSON.stringify(data.user));

      toast({
        title: "Login Successful",
        description: data.message,
        duration: 3000,
      });

      navigate("/");
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <div className="space-y-2">
              <label htmlFor="email" className="text-gray-400 text-sm">
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-gray-400 text-sm">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-md text-white font-medium transition-all duration-200 ${
                isLoading
                  ? "bg-green-600 opacity-70 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-green-600 font-medium hover:underline"
              >
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
