import React, { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  Plus, X, Check, Trash2, ChevronRight, ChevronLeft, Users, FileText,
  Receipt, BarChart3, Printer, Download, AlertTriangle,
} from "lucide-react";

const TEAL = "#0E6B64";
const TEAL_DARK = "#0A4F4A";
const INK = "#14211F";
const PAPER = "#F6F8F7";
const CARD = "#FFFFFF";
const LINE = "#DCE5E2";
const RUST = "#B4552E";
const GOOD = "#2F7A52";
const AMBER = "#B08A2E";

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"];
const EXPENSE_CATEGORIES = ["Raw materials", "Packaging", "Logistics", "Salaries", "Utilities", "Other"];
const THEMES = ["classic", "teal", "minimal"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function displayDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function monthKey(iso) {
  return iso ? iso.slice(0, 7) : "";
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short" });
}

function lineTotal(items) {
  return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
}

function invoiceTotal(inv) {
  const subtotal = lineTotal(inv.items);
  const afterDiscount = subtotal * (1 - (Number(inv.discountPct) || 0) / 100);
  const tax = afterDiscount * ((Number(inv.taxPct) || 0) / 100);
  return { subtotal, total: afterDiscount + tax };
}

const inputStyle = { width: "100%", padding: "9px 10px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, boxSizing: "border-box" };
const cardStyle = { background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px" };
const primaryBtn = { background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const ghostBtn = { padding: "9px 14px", background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, cursor: "pointer" };

export default function BillingSection() {
  const [tab, setTab] = useState("invoices"); // invoices | clients | expenses | reports | settings
  const [clients, setClients] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubC = onSnapshot(doc(db, "billing", "clients"),
      (snap) => setClients(snap.exists() ? snap.data().clients || [] : []),
      () => setError("Couldn't connect to the database. Check your connection and refresh."));
    const unsubI = onSnapshot(doc(db, "billing", "invoices"),
      (snap) => setInvoices(snap.exists() ? snap.data().invoices || [] : []),
      () => setError("Couldn't connect to the database. Check your connection and refresh."));
    const unsubE = onSnapshot(doc(db, "billing", "expenses"),
      (snap) => setExpenses(snap.exists() ? snap.data().expenses || [] : []),
      () => setError("Couldn't connect to the database. Check your connection and refresh."));
    const unsubS = onSnapshot(doc(db, "billing", "settings"),
      (snap) => setSettings(snap.exists() ? snap.data() : { businessName: "", address: "", phone: "", email: "", footerNote: "", nextInvoiceNumber: 1, theme: "teal" }),
      () => setError("Couldn't connect to the database. Check your connection and refresh."));
    return () => { unsubC(); unsubI(); unsubE(); unsubS(); };
  }, []);

  const saveClients = useCallback(async (next) => {
    setClients(next); setSaving(true);
    try { await setDoc(doc(db, "billing", "clients"), { clients: next }); setError(""); }
    catch { setError("Couldn't save. Check your connection and try again."); }
    finally { setSaving(false); }
  }, []);

  const saveInvoices = useCallback(async (next) => {
    setInvoices(next); setSaving(true);
    try { await setDoc(doc(db, "billing", "invoices"), { invoices: next }); setError(""); }
    catch { setError("Couldn't save. Check your connection and try again."); }
    finally { setSaving(false); }
  }, []);

  const saveExpenses = useCallback(async (next) => {
    setExpenses(next); setSaving(true);
    try { await setDoc(doc(db, "billing", "expenses"), { expenses: next }); setError(""); }
    catch { setError("Couldn't save. Check your connection and try again."); }
    finally { setSaving(false); }
  }, []);

  const saveSettings = useCallback(async (next) => {
    setSettings(next); setSaving(true);
    try { await setDoc(doc(db, "billing", "settings"), next); setError(""); }
    catch { setError("Couldn't save. Check your connection and try again."); }
    finally { setSaving(false); }
  }, []);

  const loading = clients === null || invoices === null || expenses === null || settings === null;
  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#7C8F8B", fontSize: 13 }}>Loading billing...</div>;

  const tabBtn = (active) => ({
    padding: "7px 12px", borderRadius: 20, border: "none", fontSize: 12.5, fontWeight: 600,
    background: active ? "#DCEFEC" : "transparent", color: active ? TEAL_DARK : "#5C726D", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 5,
  });

  function exportBackup() {
    const data = { clients, invoices, expenses, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `impact-water-billing-backup-${isoToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fade-in">
      {error && (
        <div style={{ margin: "0 0 10px", background: "#FBEAE3", color: RUST, fontSize: 12.5, padding: "8px 12px", borderRadius: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}
      {saving && <div style={{ fontSize: 11, color: "#7C8F8B", marginBottom: 6 }}>Saving...</div>}

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setTab("invoices")} style={tabBtn(tab === "invoices")}><FileText size={13} /> Invoices</button>
        <button onClick={() => setTab("clients")} style={tabBtn(tab === "clients")}><Users size={13} /> Clients</button>
        <button onClick={() => setTab("expenses")} style={tabBtn(tab === "expenses")}><Receipt size={13} /> Expenses</button>
        <button onClick={() => setTab("reports")} style={tabBtn(tab === "reports")}><BarChart3 size={13} /> Reports</button>
      </div>

      {tab === "invoices" && (
        <InvoicesTab clients={clients} invoices={invoices} saveInvoices={saveInvoices} settings={settings} saveSettings={saveSettings} />
      )}
      {tab === "clients" && <ClientsTab clients={clients} saveClients={saveClients} />}
      {tab === "expenses" && <ExpensesTab expenses={expenses} saveExpenses={saveExpenses} />}
      {tab === "reports" && (
        <ReportsTab invoices={invoices} expenses={expenses} settings={settings} saveSettings={saveSettings} onExport={exportBackup} />
      )}
    </div>
  );
}

// ================= CLIENTS =================
function ClientsTab({ clients, saveClients }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  function add() {
    if (!name.trim()) return;
    saveClients([...clients, { id: uid(), name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim() }]);
    setName(""); setPhone(""); setEmail(""); setAddress(""); setAdding(false);
  }
  function del(c) {
    if (!window.confirm(`Delete client "${c.name}"?`)) return;
    saveClients(clients.filter((x) => x.id !== c.id));
  }

  return (
    <div>
      {clients.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "30px 12px", color: "#6B7D79", fontSize: 13.5 }}>No clients yet.</div>
      )}
      <div className="grid-cards" style={{ marginBottom: 12 }}>
        {clients.map((c) => (
          <div key={c.id} style={{ ...cardStyle, marginBottom: 10 }} className="card-anim">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
              <button onClick={() => del(c)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                <Trash2 size={14} color="#B7C3C0" />
              </button>
            </div>
            {c.phone && <div style={{ fontSize: 12, color: "#7C8F8B", marginTop: 2 }}>{c.phone}</div>}
            {c.email && <div style={{ fontSize: 12, color: "#7C8F8B" }}>{c.email}</div>}
            {c.address && <div style={{ fontSize: 12, color: "#7C8F8B", marginTop: 4 }}>{c.address}</div>}
          </div>
        ))}
      </div>
      {adding ? (
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New client</div>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={{ ...primaryBtn, flex: 1 }}>Add client</button>
            <button onClick={() => setAdding(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "11px 0", border: `1.5px dashed ${LINE}`, borderRadius: 12, background: "transparent", color: TEAL_DARK, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
          <Plus size={15} /> Add client
        </button>
      )}
    </div>
  );
}

// ================= EXPENSES =================
function ExpensesTab({ expenses, saveExpenses }) {
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState(PAYMENT_MODES[0]);

  function add() {
    if (!Number(amount)) return;
    saveExpenses([{ id: uid(), dateISO: isoToday(), category, description: description.trim(), amount: Number(amount), paymentMode: mode }, ...expenses]);
    setDescription(""); setAmount(""); setAdding(false);
  }
  function del(e) {
    if (!window.confirm("Delete this expense?")) return;
    saveExpenses(expenses.filter((x) => x.id !== e.id));
  }

  return (
    <div>
      {expenses.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "30px 12px", color: "#6B7D79", fontSize: 13.5 }}>No expenses logged yet.</div>
      )}
      <div className="grid-cards" style={{ marginBottom: 12 }}>
        {expenses.map((e) => (
          <div key={e.id} style={{ ...cardStyle, marginBottom: 10 }} className="card-anim">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.category}</div>
                {e.description && <div style={{ fontSize: 12, color: "#7C8F8B", marginTop: 2 }}>{e.description}</div>}
                <div style={{ fontSize: 11.5, color: "#9BA9A5", marginTop: 4 }}>{displayDate(e.dateISO)} · {e.paymentMode}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: RUST }}>-{e.amount}</div>
                <button onClick={() => del(e)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                  <Trash2 size={13} color="#B7C3C0" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New expense</div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, marginBottom: 8, background: "#fff" }}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" style={inputStyle} />
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={{ ...primaryBtn, flex: 1 }}>Add expense</button>
            <button onClick={() => setAdding(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "11px 0", border: `1.5px dashed ${LINE}`, borderRadius: 12, background: "transparent", color: TEAL_DARK, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
          <Plus size={15} /> Add expense
        </button>
      )}
    </div>
  );
}

// ================= INVOICES =================
function InvoicesTab({ clients, invoices, saveInvoices, settings, saveSettings }) {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [clientId, setClientId] = useState("");
  const [dueDateISO, setDueDateISO] = useState("");
  const [items, setItems] = useState([{ id: uid(), desc: "", qty: "", rate: "" }]);
  const [discountPct, setDiscountPct] = useState("");
  const [taxPct, setTaxPct] = useState("");
  const [theme, setTheme] = useState(settings.theme || "teal");
  const [amountPaidDraft, setAmountPaidDraft] = useState("");
  const [modeDraft, setModeDraft] = useState(PAYMENT_MODES[0]);

  function clientById(id) { return clients.find((c) => c.id === id); }
  function addItem() { setItems([...items, { id: uid(), desc: "", qty: "", rate: "" }]); }
  function removeItem(id) { setItems(items.filter((i) => i.id !== id)); }
  function updateItem(id, field, value) { setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i))); }

  function createInvoice() {
    if (!clientId) return;
    const validItems = items.filter((i) => i.desc.trim() && Number(i.qty) > 0 && Number(i.rate) >= 0);
    if (validItems.length === 0) return;
    const num = settings.nextInvoiceNumber || 1;
    const inv = {
      id: uid(),
      number: `INV-${String(num).padStart(4, "0")}`,
      clientId,
      dateISO: isoToday(),
      dueDateISO: dueDateISO || isoToday(),
      items: validItems.map((i) => ({ id: i.id, desc: i.desc.trim(), qty: Number(i.qty), rate: Number(i.rate) })),
      discountPct: Number(discountPct) || 0,
      taxPct: Number(taxPct) || 0,
      status: "unpaid",
      amountPaid: 0,
      paymentMode: "",
      theme,
    };
    saveInvoices([inv, ...invoices]);
    saveSettings({ ...settings, nextInvoiceNumber: num + 1, theme });
    setCreating(false);
    setClientId(""); setDueDateISO(""); setItems([{ id: uid(), desc: "", qty: "", rate: "" }]); setDiscountPct(""); setTaxPct("");
  }

  function deleteInvoice(inv) {
    if (!window.confirm(`Delete invoice ${inv.number}?`)) return false;
    saveInvoices(invoices.filter((x) => x.id !== inv.id));
    return true;
  }

  function openInvoice(inv) {
    setOpenId(inv.id);
    setAmountPaidDraft(String(inv.amountPaid || 0));
    setModeDraft(inv.paymentMode || PAYMENT_MODES[0]);
  }

  function recordPayment(inv) {
    const paid = Number(amountPaidDraft) || 0;
    const { total } = invoiceTotal(inv);
    const status = paid <= 0 ? "unpaid" : paid >= total ? "paid" : "partial";
    saveInvoices(invoices.map((x) => (x.id === inv.id ? { ...x, amountPaid: paid, paymentMode: modeDraft, status } : x)));
  }

  const openInvoice_ = openId ? invoices.find((i) => i.id === openId) : null;

  if (openInvoice_) {
    return <InvoiceDetail invoice={openInvoice_} client={clientById(openInvoice_.clientId)} settings={settings}
      amountPaidDraft={amountPaidDraft} setAmountPaidDraft={setAmountPaidDraft}
      modeDraft={modeDraft} setModeDraft={setModeDraft}
      onRecordPayment={() => recordPayment(openInvoice_)}
      onBack={() => setOpenId(null)} onDelete={() => { if (deleteInvoice(openInvoice_)) setOpenId(null); }} />;
  }

  return (
    <div>
      {invoices.length === 0 && !creating && (
        <div style={{ textAlign: "center", padding: "30px 12px", color: "#6B7D79", fontSize: 13.5 }}>No invoices yet.</div>
      )}
      <div className="grid-cards" style={{ marginBottom: 12 }}>
        {invoices.map((inv) => {
          const c = clientById(inv.clientId);
          const { total } = invoiceTotal(inv);
          const overdue = inv.status !== "paid" && inv.dueDateISO < isoToday();
          const statusColor = inv.status === "paid" ? GOOD : overdue ? RUST : inv.status === "partial" ? AMBER : "#8A9A96";
          const statusLabel = inv.status === "paid" ? "Paid" : overdue ? "Overdue" : inv.status === "partial" ? "Partial" : "Unpaid";
          return (
            <div key={inv.id} style={{ ...cardStyle, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }} className="card-anim">
              <button onClick={() => openInvoice(inv)} style={{ flex: 1, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.number} · {c ? c.name : "Unknown client"}</div>
                <div style={{ fontSize: 11.5, color: "#7C8F8B", marginTop: 2 }}>{displayDate(inv.dateISO)} · Rs {total.toFixed(2)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: statusColor, marginTop: 4 }}>{statusLabel}</div>
              </button>
              <ChevronRight size={17} color="#9BA9A5" />
            </div>
          );
        })}
      </div>

      {creating ? (
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New invoice</div>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ ...inputStyle, marginBottom: 8, background: "#fff" }}>
            <option value="">Select client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label style={{ fontSize: 11.5, color: "#7C8F8B" }}>Due date</label>
          <input type="date" value={dueDateISO} onChange={(e) => setDueDateISO(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />

          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Line items</div>
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input placeholder="Description" value={it.desc} onChange={(e) => updateItem(it.id, "desc", e.target.value)} style={{ ...inputStyle, flex: 2 }} />
              <input placeholder="Qty" value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)} inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
              <input placeholder="Rate" value={it.rate} onChange={(e) => updateItem(it.id, "rate", e.target.value)} inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
              {items.length > 1 && (
                <button onClick={() => removeItem(it.id)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                  <X size={15} color="#9BA9A5" />
                </button>
              )}
            </div>
          ))}
          <button onClick={addItem} style={{ background: "transparent", border: "none", color: TEAL_DARK, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "4px 0 10px" }}>
            <Plus size={12} /> Add line
          </button>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11.5, color: "#7C8F8B" }}>Discount %</label>
              <input value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} inputMode="numeric" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11.5, color: "#7C8F8B" }}>Tax / other %</label>
              <input value={taxPct} onChange={(e) => setTaxPct(e.target.value)} inputMode="numeric" style={inputStyle} />
            </div>
          </div>

          <label style={{ fontSize: 11.5, color: "#7C8F8B" }}>Invoice theme</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {THEMES.map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1.5px solid ${theme === t ? TEAL : LINE}`, background: theme === t ? "#DCEFEC" : "#fff", color: theme === t ? TEAL_DARK : "#7C8F8B", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={createInvoice} style={{ ...primaryBtn, flex: 1 }}>Save invoice</button>
            <button onClick={() => setCreating(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} disabled={clients.length === 0}
          style={{ width: "100%", padding: "11px 0", border: `1.5px dashed ${LINE}`, borderRadius: 12, background: "transparent", color: clients.length === 0 ? "#B7C3C0" : TEAL_DARK, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: clients.length === 0 ? "default" : "pointer" }}>
          <Plus size={15} /> New invoice
        </button>
      )}
      {clients.length === 0 && <div style={{ fontSize: 12, color: "#8A9A96", textAlign: "center", marginTop: 8 }}>Add a client first.</div>}
    </div>
  );
}

function InvoiceDetail({ invoice, client, settings, amountPaidDraft, setAmountPaidDraft, modeDraft, setModeDraft, onRecordPayment, onBack, onDelete }) {
  const { subtotal, total } = invoiceTotal(invoice);
  const overdue = invoice.status !== "paid" && invoice.dueDateISO < isoToday();

  function handlePrint() {
    window.print();
  }

  const themeStyles = {
    classic: { accent: "#14211F", font: "Georgia, 'Times New Roman', serif" },
    teal: { accent: TEAL, font: "-apple-system, sans-serif" },
    minimal: { accent: "#444", font: "-apple-system, sans-serif" },
  };
  const th = themeStyles[invoice.theme] || themeStyles.teal;

  return (
    <div>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: TEAL_DARK, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <ChevronLeft size={16} /> Invoices
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: TEAL_DARK, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            <Printer size={14} /> Print / Save PDF
          </button>
          <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: RUST, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div id="invoice-print-area" style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 20, fontFamily: th.font }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${th.accent}`, paddingBottom: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: th.accent }}>{settings.businessName || "Your Business Name"}</div>
            <div style={{ fontSize: 11.5, color: "#666", marginTop: 2, whiteSpace: "pre-line" }}>{settings.address}</div>
            {settings.phone && <div style={{ fontSize: 11.5, color: "#666" }}>{settings.phone}</div>}
            {settings.email && <div style={{ fontSize: 11.5, color: "#666" }}>{settings.email}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{invoice.number}</div>
            <div style={{ fontSize: 11.5, color: "#666", marginTop: 4 }}>Date: {displayDate(invoice.dateISO)}</div>
            <div style={{ fontSize: 11.5, color: "#666" }}>Due: {displayDate(invoice.dueDateISO)}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 }}>Bill to</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{client ? client.name : "Unknown client"}</div>
          {client?.address && <div style={{ fontSize: 12, color: "#666" }}>{client.address}</div>}
          {client?.phone && <div style={{ fontSize: 12, color: "#666" }}>{client.phone}</div>}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${th.accent}` }}>
              <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 11.5, color: "#666" }}>Description</th>
              <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 11.5, color: "#666" }}>Qty</th>
              <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 11.5, color: "#666" }}>Rate</th>
              <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 11.5, color: "#666" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                <td style={{ padding: "8px 4px", fontSize: 13 }}>{it.desc}</td>
                <td style={{ padding: "8px 4px", fontSize: 13, textAlign: "right" }}>{it.qty}</td>
                <td style={{ padding: "8px 4px", fontSize: 13, textAlign: "right" }}>{it.rate}</td>
                <td style={{ padding: "8px 4px", fontSize: 13, textAlign: "right" }}>{(it.qty * it.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <div style={{ width: 220 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: "#666" }}>Subtotal</span><span>{subtotal.toFixed(2)}</span>
            </div>
            {Number(invoice.discountPct) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: "#666" }}>Discount ({invoice.discountPct}%)</span><span>-{(subtotal * invoice.discountPct / 100).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.taxPct) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: "#666" }}>Tax/other ({invoice.taxPct}%)</span><span>+{((subtotal * (1 - invoice.discountPct / 100)) * invoice.taxPct / 100).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, borderTop: `1.5px solid ${th.accent}`, paddingTop: 6, marginTop: 4 }}>
              <span>Total</span><span>Rs {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {settings.footerNote && <div style={{ fontSize: 11, color: "#999", borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>{settings.footerNote}</div>}
      </div>

      <div className="no-print" style={{ ...cardStyle, marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Payment tracking</div>
        {overdue && (
          <div style={{ background: "#FBEAE3", color: RUST, fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
            Overdue — due date has passed
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: "#7C8F8B" }}>Amount paid</label>
            <input value={amountPaidDraft} onChange={(e) => setAmountPaidDraft(e.target.value)} inputMode="numeric" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: "#7C8F8B" }}>Mode</label>
            <select value={modeDraft} onChange={(e) => setModeDraft(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <button onClick={onRecordPayment} style={{ ...primaryBtn, width: "100%" }}>Update payment status</button>
      </div>
    </div>
  );
}

// ================= REPORTS =================
function ReportsTab({ invoices, expenses, settings, saveSettings, onExport }) {
  const [editingSettings, setEditingSettings] = useState(false);
  const [form, setForm] = useState(settings);

  const totalRevenue = invoices.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => {
    const { total } = invoiceTotal(i);
    return s + Math.max(0, total - (Number(i.amountPaid) || 0));
  }, 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const net = totalRevenue - totalExpenses;

  // Last 6 months revenue vs expenses
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthlyRevenue = months.map((mk) => invoices.filter((i) => monthKey(i.dateISO) === mk).reduce((s, i) => s + (Number(i.amountPaid) || 0), 0));
  const monthlyExpenses = months.map((mk) => expenses.filter((e) => monthKey(e.dateISO) === mk).reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const maxVal = Math.max(1, ...monthlyRevenue, ...monthlyExpenses);

  const statCard = (label, value, color) => (
    <div style={{ ...cardStyle }} className="card-anim">
      <div style={{ fontSize: 11, color: "#7C8F8B" }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: color || INK, marginTop: 4 }}>Rs {value.toFixed(2)}</div>
    </div>
  );

  function saveBiz() {
    saveSettings({ ...settings, ...form });
    setEditingSettings(false);
  }

  return (
    <div>
      <div className="grid-cards" style={{ marginBottom: 16 }}>
        {statCard("Revenue collected", totalRevenue, GOOD)}
        {statCard("Outstanding", totalOutstanding, totalOutstanding > 0 ? RUST : GOOD)}
        {statCard("Total expenses", totalExpenses, RUST)}
        {statCard("Net", net, net >= 0 ? GOOD : RUST)}
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Last 6 months</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
          {months.map((mk, idx) => (
            <div key={mk} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: "100%" }}>
                <div style={{ width: 10, background: GOOD, borderRadius: "3px 3px 0 0", height: `${(monthlyRevenue[idx] / maxVal) * 100}%`, minHeight: 2, transition: "height 0.3s ease" }} />
                <div style={{ width: 10, background: RUST, borderRadius: "3px 3px 0 0", height: `${(monthlyExpenses[idx] / maxVal) * 100}%`, minHeight: 2, transition: "height 0.3s ease" }} />
              </div>
              <div style={{ fontSize: 10.5, color: "#7C8F8B", marginTop: 6 }}>{monthLabel(mk)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "#7C8F8B" }}>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: GOOD, borderRadius: 2, marginRight: 4 }} />Revenue</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: RUST, borderRadius: 2, marginRight: 4 }} />Expenses</span>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Business details (for invoices)</div>
          {!editingSettings && (
            <button onClick={() => { setForm(settings); setEditingSettings(true); }} style={{ border: "none", background: "transparent", color: TEAL_DARK, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
          )}
        </div>
        {editingSettings ? (
          <>
            <input placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
            <input placeholder="Invoice footer note (e.g. bank details)" value={form.footerNote} onChange={(e) => setForm({ ...form, footerNote: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveBiz} style={{ ...primaryBtn, flex: 1 }}>Save</button>
              <button onClick={() => setEditingSettings(false)} style={ghostBtn}>Cancel</button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: "#7C8F8B", lineHeight: 1.6 }}>
            {settings.businessName || <span style={{ color: "#B7C3C0" }}>No business name set</span>}<br />
            {settings.address}<br />
            {settings.phone} {settings.email}
          </div>
        )}
      </div>

      <button onClick={onExport} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...primaryBtn, background: INK }}>
        <Download size={14} /> Export all billing data (backup)
      </button>
    </div>
  );
}
