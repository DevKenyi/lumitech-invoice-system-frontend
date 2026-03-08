// InvoiceList.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import { Plus, FileText, ArrowRight, TrendingUp, Users, LogOut } from "lucide-react";

function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });
  const navigate = useNavigate();
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);

  useEffect(() => {
    api.get("/api/invoices")
      .then(res => {
        setInvoices(res.data);

        const total = res.data.reduce((sum, inv) => sum + inv.total, 0);
        const paid = res.data.filter(inv => inv.status === "PAID").length;
        const pending = res.data.filter(inv => inv.status === "PENDING").length;

        setStats({ total, paid, pending });
      })
      .catch(err => console.error(err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">

            {/* Left Side */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Lumitech Invoices
                </h1>
                <p className="text-sm text-slate-500">
                  Manage your billing efficiently
                </p>
              </div>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">

              {user && (
                <div className="text-sm text-slate-600 mr-2">
                  {user.username || user.sub || 'User'} • {role || 'Member'}
                </div>
              )}

              <Link
                to="/clients/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900
                           text-white font-medium rounded-xl transition"
              >
                <Users className="w-4 h-4" />
                Add Customer
              </Link>

              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 
                           text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 
                           hover:shadow-xl hover:shadow-blue-600/30 transform hover:-translate-y-0.5 
                           transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Create Invoice
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200
                           text-red-600 rounded-xl hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  ₦ {stats.total.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Paid Invoices</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.paid}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
            <span className="text-sm text-slate-500">{invoices.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Invoice No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <p>No invoices found. Create your first invoice!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        #{inv.invoiceNumber}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        {inv.client.name}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                        ₦ {inv.total.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <ArrowRight className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export default InvoiceList;