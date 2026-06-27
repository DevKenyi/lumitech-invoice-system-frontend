// CreateClient.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
} from "lucide-react";

function CreateClient() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    customerType: "RETAIL",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("api/clients", form);
      navigate("/clients");
    } catch (err) {
      console.error("CREATE CLIENT ERROR:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sticky Header with glassmorphism */}
      <header className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Create New Customer
            </h1>
            <div className="w-20" /> {/* spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Main Form Card */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <User className="w-4 h-4 text-slate-400" />
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g., John Doe or Company Ltd"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Phone className="w-4 h-4 text-slate-400" />
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+234 123 456 7890"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-slate-400" />
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows="3"
                placeholder="Street, city, postal code..."
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
              />
            </div>

            {/* Customer Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                Customer Type
              </label>
              <div className="flex gap-2">
                {["RETAIL", "WHOLESALE"].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, customerType: type })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                      form.customerType === type
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">Wholesale customers automatically get wholesale pricing at POS</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Customer...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Customer
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateClient;
