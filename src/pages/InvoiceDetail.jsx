import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import { ArrowLeft, Download } from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [editingItems, setEditingItems] = useState([]);
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const user = getUserFromToken();
  const isAdmin = user && (user.role === "ADMIN" || (Array.isArray(user.roles) && user.roles.includes("ADMIN")));

  // ✅ Fetch Invoice
  const fetchInvoice = useCallback(async () => {
    try {
      const res = await api.get(`api/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {
      console.error("FETCH INVOICE ERROR:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // ✅ Currency Formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // ✅ Mark Invoice as Paid
  const markAsPaid = async () => {
    try {
      setIsPaying(true);
      await api.put(`api/invoices/${id}/mark-paid`);
      await fetchInvoice();
    } catch (err) {
      console.error("MARK AS PAID ERROR:", err);
    } finally {
      setIsPaying(false);
    }
  };

  // ✅ Secure PDF Download (JWT Included)
  const downloadPdf = async () => {
    try {
      setIsDownloading(true);

      const response = await api.get(`api/invoices/${id}/pdf`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `invoice-${invoice.invoiceNumber}.pdf`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("PDF DOWNLOAD ERROR:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // ✅ Delete Invoice (admin only)
  const deleteInvoice = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`api/invoices/${id}`);
      setToast({ visible: true, message: 'Invoice deleted', type: 'success' });
      navigate(`/`);
    } catch (err) {
      console.error("DELETE INVOICE ERROR:", err);
      setToast({ visible: true, message: 'Failed to delete invoice', type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ✅ Edit Prices (admin only)
  const startEditPrices = () => {
    if (!isAdmin) {
      setToast({ visible: true, message: 'You do not have permission to edit prices', type: 'error' });
      return;
    }
    setEditingItems(invoice.items?.map(item => ({ ...item })) || []);
    setIsEditingPrices(true);
  };

  const cancelEditPrices = () => {
    setEditingItems([]);
    setIsEditingPrices(false);
  };

  const handlePriceChange = (index, field, value) => {
    setEditingItems(prev => {
      const copy = prev.map(it => ({ ...it }));
      if (!copy[index]) return prev;
      if (field === 'unitPrice' || field === 'quantity') {
        copy[index][field] = value === '' ? '' : Number(value);
      } else {
        copy[index][field] = value;
      }
      return copy;
    });
  };

  const savePrices = async () => {
    if (!isAdmin) return alert('Unauthorized');
    if (!Array.isArray(editingItems) || editingItems.length === 0) {
      setToast({ visible: true, message: 'No items to save', type: 'error' });
      return;
    }

    // Basic validation
    for (let i = 0; i < editingItems.length; i++) {
      const it = editingItems[i];
      if (typeof it.unitPrice !== 'number' || isNaN(it.unitPrice) || it.unitPrice < 0) {
        setToast({ visible: true, message: `Invalid unit price for item ${i + 1}`, type: 'error' });
        return;
      }
      if (typeof it.quantity !== 'number' || isNaN(it.quantity) || it.quantity < 0) {
        setToast({ visible: true, message: `Invalid quantity for item ${i + 1}`, type: 'error' });
        return;
      }
    }

    try {
      setIsSavingPrices(true);

      await api.put(`api/invoices/${id}/prices`, { items: editingItems });

      await fetchInvoice();
      setIsEditingPrices(false);
      setEditingItems([]);
      setToast({ visible: true, message: 'Prices updated', type: 'success' });
    } catch (err) {
      console.error('SAVE PRICES ERROR:', err);
      setToast({ visible: true, message: 'Failed to save prices', type: 'error' });
    } finally {
      setIsSavingPrices(false);
    }
  };

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading invoice...</p>
      </div>
    );
  }

  const totalItems = invoice.items?.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  ) || 0;

  const grandTotal = totalItems + (invoice.tax || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-10 px-6">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">
                Invoice #{invoice.invoiceNumber}
              </h2>
              <p className="text-sm text-slate-500">
                Issue Date: {invoice.issueDate}
              </p>
              <p className="text-sm text-slate-500">
                Due Date: {invoice.dueDate}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadPdf}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow disabled:opacity-50"
              >
                <Download size={16} />
                {isDownloading ? "Downloading..." : "Download PDF"}
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition shadow disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Invoice"}
                </button>
              )}
            </div>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
            <ConfirmModal visible={showDeleteModal} title="Delete invoice" message="Are you sure you want to delete this invoice? This action cannot be undone." onConfirm={deleteInvoice} onCancel={() => setShowDeleteModal(false)} loading={isDeleting} />
          </div>

          {/* Client Info */}
          <div className="border rounded-xl p-4 bg-slate-50">
            <h3 className="font-semibold mb-2">Client</h3>
            <p className="font-medium">{invoice.client?.name}</p>
            {invoice.client?.email && (
              <p className="text-sm text-slate-500">{invoice.client.email}</p>
            )}
            {invoice.client?.phone && (
              <p className="text-sm text-slate-500">{invoice.client.phone}</p>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold mb-4">Items</h3>
              {isAdmin && !isEditingPrices && (
                <button
                  onClick={startEditPrices}
                  className="text-sm bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700 transition"
                >
                  Edit Prices
                </button>
              )}

              {isAdmin && isEditingPrices && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={savePrices}
                    disabled={isSavingPrices}
                    className="text-sm bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {isSavingPrices ? 'Saving...' : 'Save Prices'}
                  </button>
                  <button
                    onClick={cancelEditPrices}
                    className="text-sm bg-slate-200 text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-slate-600">
                  <th className="py-2">Description</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Unit Price</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(isEditingPrices ? editingItems : invoice.items)?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2">
                      {isEditingPrices ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                          className="w-24 border rounded px-2 py-1"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="py-2">
                      {isEditingPrices ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handlePriceChange(index, 'unitPrice', e.target.value)}
                          className="w-36 border rounded px-2 py-1"
                        />
                      ) : (
                        formatCurrency(item.unitPrice)
                      )}
                    </td>
                    <td className="py-2">
                      {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="text-right space-y-2 pt-4">
            <p>Subtotal: {formatCurrency(totalItems)}</p>
            <p>Tax: {formatCurrency(invoice.tax)}</p>
            <p className="text-xl font-bold">
              Total: {formatCurrency(grandTotal)}
            </p>
          </div>

          {/* Status Section */}
          <div className="flex items-center gap-4 pt-4">

            <span
              className={`px-3 py-1 rounded-full text-sm font-medium
                ${invoice.status === "PAID"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"}`}
            >
              {invoice.status}
            </span>

            {invoice.status !== "PAID" && (
              <button
                onClick={markAsPaid}
                disabled={isPaying}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isPaying ? "Updating..." : "Mark as Paid"}
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default InvoiceDetail;