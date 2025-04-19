import { useState, useRef, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import { RegisterFormData, UserData } from "@/types/user.types";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { NODE_SERVER_URL } from "@/constants/utils";
import { Loader } from "lucide-react";

const RegisterPage = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "2004-01-01",
    gender: "Other",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    if (userId.userName) {
      navigate("/");
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setProfileImage(e.dataTransfer.files[0]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("dateOfBirth", formData.dateOfBirth);
      formDataToSend.append("gender", formData.gender);

      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
      }

      const response = await fetch(`${NODE_SERVER_URL}/api/user/register`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("userData", JSON.stringify(data.user));

      toast({
        title: "Success",
        description: data?.message,
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
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="text-gray-300 text-sm font-medium"
                >
                  Full Name*
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-gray-300 text-sm font-medium"
                >
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-gray-300 text-sm font-medium"
                >
                  Password*
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-gray-300 text-sm font-medium"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="dateOfBirth"
                  className="text-gray-300 text-sm font-medium"
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
              </div>
            </div>

            {/* Gender Select */}
            <div className="space-y-2">
              <label
                htmlFor="gender"
                className="text-gray-300 text-sm font-medium"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-gray-300 text-sm font-medium">
                Profile Image
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={triggerFileInput}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging
                    ? "border-green-500 bg-gray-700/50"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                {profileImage ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={URL.createObjectURL(profileImage)}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profileImage.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(profileImage.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileImage(null);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400 mb-1">
                      Drag & drop your image here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports JPG, PNG up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg text-white font-medium transition-all ${
                isLoading
                  ? "bg-green-600 opacity-80 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin h-5 w-5 text-white" />
                  Registering...
                </span>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-400 hover:text-green-300 font-medium hover:underline"
              >
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
