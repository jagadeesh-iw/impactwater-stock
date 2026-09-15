import React, { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { Plus, Minus, Package, ClipboardList, ChevronRight, ChevronLeft, X, Check, AlertTriangle, Loader2, Lock, Trash2, MessageCircle, Send } from "lucide-react";

const TEAL = "#0E6B64";
const TEAL_DARK = "#0A4F4A";
const INK = "#14211F";
const PAPER = "#F6F8F7";
const CARD = "#FFFFFF";
const LINE = "#DCE5E2";
const RUST = "#B4552E";
const GOOD = "#2F7A52";

// CHANGE THIS to whatever passcode you want the team to use.
const TEAM_PIN = "1234";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr() {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ---------- PIN gate ----------
function PinGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("iw_unlocked") === "1");
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (pin === TEAM_PIN) {
      localStorage.setItem("iw_unlocked", "1");
      setUnlocked(true);
    } else {
      setWrong(true);
      setPin("");
    }
  }

  if (unlocked) return children;

  return (
    <div style={{ background: PAPER, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <form onSubmit={submit} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 26, width: 280, textAlign: "center" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "#E7EFED", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Lock size={18} color={TEAL_DARK} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4 }}>Impact Water Stock</div>
        <div style={{ fontSize: 12.5, color: "#7C8F8B", marginBottom: 16 }}>Enter the team passcode to continue</div>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setWrong(false); }}
          style={{ width: "100%", textAlign: "center", fontSize: 16, letterSpacing: 3, padding: "10px 0", border: `1.5px solid ${wrong ? RUST : LINE}`, borderRadius: 8, boxSizing: "border-box", marginBottom: 10 }}
        />
        {wrong && <div style={{ fontSize: 12, color: RUST, marginBottom: 10 }}>Wrong passcode, try again</div>}
        <button type="submit" style={{ width: "100%", background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          Unlock
        </button>
      </form>
    </div>
  );
}

// ---------- Chat widget ----------
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [name, setName] = useState(() => localStorage.getItem("iw_chat_name") || "");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "impact_water", "chat"), (snap) => {
      setMessages(snap.exists() ? snap.data().messages || [] : []);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    if (!text.trim() || !name.trim()) return;
    localStorage.setItem("iw_chat_name", name.trim());
    const msg = { id: uid(), text: text.trim(), name: name.trim(), ts: Date.now() };
    setText("");
    try {
      await setDoc(doc(db, "impact_water", "chat"), { messages: arrayUnion(msg) }, { merge: true });
    } catch {
      // silently ignore — message just won't send, chat isn't critical path
    }
  }

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 78, right: 16, width: 300, maxWidth: "calc(100vw - 32px)",
          background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 50,
        }}>
          <div style={{ background: TEAL, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 700 }}>Team chat</span>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          <div style={{ height: 220, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12, color: "#9BA9A5", textAlign: "center", marginTop: 20 }}>No messages yet</div>
            )}
            {messages.map((m) => (
              <div key={m.id} style={{ fontSize: 13, color: INK, lineHeight: 1.4 }}>
                {m.text} <span style={{ color: "#7C8F8B" }}>- {m.name}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ borderTop: `1px solid ${LINE}`, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              style={{ width: "100%", padding: "8px 10px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                style={{ flex: 1, padding: "8px 10px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
              />
              <button
                onClick={send}
                disabled={!text.trim() || !name.trim()}
                style={{
                  width: 36, borderRadius: 8, border: "none",
                  background: !text.trim() || !name.trim() ? "#B7C3C0" : TEAL,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: !text.trim() || !name.trim() ? "default" : "pointer",
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 20, right: 16, width: 52, height: 52, borderRadius: 26,
          background: TEAL, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 50,
        }}
      >
        {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>
    </>
  );
}

// ---------- Main app ----------
export default function App() {
  return (
    <PinGate>
      <StockPOTracker />
      <ChatWidget />
    </PinGate>
  );
}

function StockPOTracker() {
  const [tab, setTab] = useState("stock");
  const [products, setProducts] = useState(null); // null = loading
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [addingProduct, setAddingProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newStock, setNewStock] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [openPoId, setOpenPoId] = useState(null);
  const [creatingPo, setCreatingPo] = useState(false);
  const [poLabel, setPoLabel] = useState("");
  const [poLines, setPoLines] = useState([{ id: uid(), productId: "", qty: "" }]);
  const [allocDraft, setAllocDraft] = useState({});

  // Realtime Firestore sync — any teammate's change shows up automatically.
  useEffect(() => {
    const unsubInv = onSnapshot(
      doc(db, "impact_water", "inventory"),
      (snap) => setProducts(snap.exists() ? snap.data().products || [] : []),
      () => setError("Couldn't connect to the database. Check your connection and refresh.")
    );
    const unsubPo = onSnapshot(
      doc(db, "impact_water", "purchase_orders"),
      (snap) => setOrders(snap.exists() ? snap.data().orders || [] : []),
      () => setError("Couldn't connect to the database. Check your connection and refresh.")
    );
    return () => {
      unsubInv();
      unsubPo();
    };
  }, []);

  const saveProducts = useCallback(async (next) => {
    setProducts(next);
    setSaving(true);
    try {
      await setDoc(doc(db, "impact_water", "inventory"), { products: next });
      setError("");
    } catch {
      setError("Couldn't save stock changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, []);

  const saveOrders = useCallback(async (next) => {
    setOrders(next);
    setSaving(true);
    try {
      await setDoc(doc(db, "impact_water", "purchase_orders"), { orders: next });
      setError("");
    } catch {
      setError("Couldn't save order changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, []);

  function addProduct() {
    if (!newName.trim()) return;
    const p = {
      id: uid(),
      name: newName.trim(),
      sku: newSku.trim() || newName.trim().slice(0, 3).toUpperCase(),
      stock: Number(newStock) || 0,
    };
    saveProducts([...(products || []), p]);
    setNewName("");
    setNewSku("");
    setNewStock("");
    setAddingProduct(false);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditValue(String(p.stock));
  }

  function commitEdit(p) {
    const val = Number(editValue);
    if (Number.isNaN(val) || val < 0) {
      setEditingId(null);
      return;
    }
    const next = products.map((x) => (x.id === p.id ? { ...x, stock: val } : x));
    saveProducts(next);
    setEditingId(null);
  }

  function step(p, delta) {
    const next = products.map((x) =>
      x.id === p.id ? { ...x, stock: Math.max(0, x.stock + delta) } : x
    );
    saveProducts(next);
  }

  function deleteProduct(p) {
    if (!window.confirm(`Delete "${p.name}"? This won't undo.`)) return;
    saveProducts(products.filter((x) => x.id !== p.id));
  }

  function deleteOrder(po) {
    if (!window.confirm(`Delete order "${po.label}"? This won't undo. Stock already deducted for it will not be restored.`)) return false;
    saveOrders(orders.filter((o) => o.id !== po.id));
    return true;
  }

  function addPoLine() {
    setPoLines([...poLines, { id: uid(), productId: "", qty: "" }]);
  }

  function removePoLine(id) {
    setPoLines(poLines.filter((l) => l.id !== id));
  }

  function updatePoLine(id, field, value) {
    setPoLines(poLines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function createPo() {
    const validLines = poLines.filter((l) => l.productId && Number(l.qty) > 0);
    if (validLines.length === 0) return;
    const po = {
      id: uid(),
      label: poLabel.trim() || `PO ${(orders?.length || 0) + 1}`,
      date: todayStr(),
      status: "pending",
      lines: validLines.map((l) => ({
        id: l.id,
        productId: l.productId,
        qtyOrdered: Number(l.qty),
        qtyAllocated: 0,
      })),
      shipped: false,
    };
    saveOrders([po, ...(orders || [])]);
    setCreatingPo(false);
    setPoLabel("");
    setPoLines([{ id: uid(), productId: "", qty: "" }]);
  }

  function productById(id) {
    return (products || []).find((p) => p.id === id);
  }

  function openPo(po) {
    setOpenPoId(po.id);
    const draft = {};
    po.lines.forEach((l) => {
      const prod = productById(l.productId);
      const avail = prod ? prod.stock : 0;
      draft[l.id] = l.qtyAllocated || Math.min(l.qtyOrdered, avail);
    });
    setAllocDraft(draft);
  }

  function autoAllocateAll() {
    const po = orders.find((o) => o.id === openPoId);
    if (!po) return;
    const draft = {};
    const running = {};
    po.lines.forEach((l) => {
      const prod = productById(l.productId);
      const base = prod ? prod.stock : 0;
      if (running[l.productId] === undefined) running[l.productId] = base;
      const give = Math.max(0, Math.min(l.qtyOrdered, running[l.productId]));
      draft[l.id] = give;
      running[l.productId] -= give;
    });
    setAllocDraft(draft);
  }

  function setLineAlloc(lineId, productId, value) {
    const prod = productById(productId);
    const max = prod ? prod.stock : 0;
    const v = Math.max(0, Math.min(Number(value) || 0, max));
    setAllocDraft({ ...allocDraft, [lineId]: v });
  }

  function confirmAllocation() {
    const po = orders.find((o) => o.id === openPoId);
    if (!po) return;
    const nextProducts = [...products];
    const updatedLines = po.lines.map((l) => {
      const allocated = allocDraft[l.id] || 0;
      const pIdx = nextProducts.findIndex((p) => p.id === l.productId);
      if (pIdx > -1) {
        nextProducts[pIdx] = {
          ...nextProducts[pIdx],
          stock: Math.max(0, nextProducts[pIdx].stock - allocated),
        };
      }
      return { ...l, qtyAllocated: allocated };
    });
    const fullyMet = updatedLines.every((l) => l.qtyAllocated >= l.qtyOrdered);
    const anyMet = updatedLines.some((l) => l.qtyAllocated > 0);
    const status = fullyMet ? "fulfilled" : anyMet ? "partial" : "pending";
    const nextOrders = orders.map((o) =>
      o.id === po.id ? { ...o, lines: updatedLines, status } : o
    );
    saveProducts(nextProducts);
    saveOrders(nextOrders);
    setOpenPoId(null);
  }

  function toggleShipped(poId) {
    const next = orders.map((o) => (o.id === poId ? { ...o, shipped: !o.shipped } : o));
    saveOrders(next);
  }

  if (products === null || orders === null) {
    return (
      <div style={{ background: PAPER, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} style={{ color: TEAL, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const openPo_ = openPoId ? orders.find((o) => o.id === openPoId) : null;

  return (
    <div style={{ background: PAPER, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: INK, maxWidth: 480, margin: "0 auto", paddingBottom: 24 }}>
      <div style={{ background: TEAL, padding: "22px 18px 30px", position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 22 }} viewBox="0 0 400 22" preserveAspectRatio="none">
          <path d="M0,10 C50,22 100,0 150,10 C200,20 250,2 300,10 C350,18 380,6 400,10 L400,22 L0,22 Z" fill={PAPER} />
        </svg>
        <div style={{ fontSize: 12, letterSpacing: 0.3, color: "#BFE3DE", marginBottom: 2 }}>Impact Water Co</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Stock &amp; Orders</div>
        {saving && <div style={{ fontSize: 11, color: "#BFE3DE", marginTop: 4 }}>Saving…</div>}
      </div>

      {error && (
        <div style={{ margin: "10px 16px 0", background: "#FBEAE3", color: RUST, fontSize: 12.5, padding: "8px 12px", borderRadius: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: "flex", margin: "14px 16px 6px", background: "#E7EFED", borderRadius: 10, padding: 3 }}>
        <button
          onClick={() => setTab("stock")}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            background: tab === "stock" ? CARD : "transparent",
            color: tab === "stock" ? TEAL_DARK : "#5C726D",
            boxShadow: tab === "stock" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
          }}
        >
          <Package size={15} /> Stock
        </button>
        <button
          onClick={() => setTab("orders")}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            background: tab === "orders" ? CARD : "transparent",
            color: tab === "orders" ? TEAL_DARK : "#5C726D",
            boxShadow: tab === "orders" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
          }}
        >
          <ClipboardList size={15} /> Orders
        </button>
      </div>

      {tab === "stock" && (
        <div style={{ padding: "8px 16px 0" }}>
          {(products || []).length === 0 && !addingProduct && (
            <div style={{ textAlign: "center", padding: "40px 12px", color: "#6B7D79" }}>
              <Package size={26} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div style={{ fontSize: 14 }}>No products yet. Add your first SKU to start tracking stock.</div>
            </div>
          )}

          {(products || []).map((p) => (
            <div key={p.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "#7C8F8B", marginTop: 1 }}>{p.sku}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => step(p, -1)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${LINE}`, background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <Minus size={14} color={TEAL_DARK} />
                  </button>
                  {editingId === p.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(p)}
                      onKeyDown={(e) => e.key === "Enter" && commitEdit(p)}
                      inputMode="numeric"
                      style={{ width: 52, textAlign: "center", fontSize: 15, fontWeight: 700, border: `1px solid ${TEAL}`, borderRadius: 8, padding: "5px 0" }}
                    />
                  ) : (
                    <div onClick={() => startEdit(p)} style={{ width: 52, textAlign: "center", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                      {p.stock}
                    </div>
                  )}
                  <button
                    onClick={() => step(p, 1)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${LINE}`, background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <Plus size={14} color={TEAL_DARK} />
                  </button>
                  <button
                    onClick={() => deleteProduct(p)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginLeft: 2 }}
                  >
                    <Trash2 size={14} color="#B7C3C0" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {addingProduct ? (
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New product</div>
              <input placeholder="Name (e.g. 6-pack 500ml)" value={newName} onChange={(e) => setNewName(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, marginBottom: 8, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input placeholder="SKU (optional)" value={newSku} onChange={(e) => setNewSku(e.target.value)}
                  style={{ flex: 1, padding: "9px 10px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, boxSizing: "border-box" }} />
                <input placeholder="Starting stock" value={newStock} onChange={(e) => setNewStock(e.target.value)} inputMode="numeric"
                  style={{ width: 110, padding: "9px 10px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addProduct} style={{ flex: 1, background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Add product</button>
                <button onClick={() => setAddingProduct(false)} style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingProduct(true)}
              style={{ width: "100%", padding: "11px 0", border: `1.5px dashed ${LINE}`, borderRadius: 12, background: "transparent", color: TEAL_DARK, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", marginBottom: 12 }}>
              <Plus size={15} /> Add product
            </button>
          )}
        </div>
      )}

      {tab === "orders" && !openPo_ && (
        <div style={{ padding: "8px 16px 0" }}>
          {(orders || []).length === 0 && !creatingPo && (
            <div style={{ textAlign: "center", padding: "40px 12px", color: "#6B7D79" }}>
              <ClipboardList size={26} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div style={{ fontSize: 14 }}>No purchase orders yet.</div>
            </div>
          )}

          {(orders || []).map((po) => {
            const statusColor = po.status === "fulfilled" ? GOOD : po.status === "partial" ? RUST : "#8A9A96";
            const statusLabel = po.status === "fulfilled" ? "Fulfilled" : po.status === "partial" ? "Partial" : "Pending";
            return (
              <div key={po.id}
                style={{ width: "100%", textAlign: "left", background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => openPo(po)} style={{ flex: 1, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{po.label}</div>
                  <div style={{ fontSize: 11.5, color: "#7C8F8B", marginTop: 2 }}>{po.date} · {po.lines.length} item{po.lines.length !== 1 ? "s" : ""}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                    {po.shipped && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: TEAL_DARK, background: "#DCEFEC", borderRadius: 5, padding: "2px 6px" }}>Shipped</span>
                    )}
                  </div>
                </button>
                <button onClick={() => deleteOrder(po)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6 }}>
                  <Trash2 size={15} color="#B7C3C0" />
                </button>
                <button onClick={() => openPo(po)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
                  <ChevronRight size={17} color="#9BA9A5" />
                </button>
              </div>
            );
          })}

          {creatingPo ? (
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New purchase order</div>
              <input placeholder="PO name / customer" value={poLabel} onChange={(e) => setPoLabel(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, marginBottom: 10, boxSizing: "border-box" }} />

              {poLines.map((line) => (
                <div key={line.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <select value={line.productId} onChange={(e) => updatePoLine(line.id, "productId", e.target.value)}
                    style={{ flex: 1, padding: "9px 8px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                    <option value="">Select product</option>
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input placeholder="Qty" value={line.qty} onChange={(e) => updatePoLine(line.id, "qty", e.target.value)} inputMode="numeric"
                    style={{ width: 64, padding: "9px 8px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                  {poLines.length > 1 && (
                    <button onClick={() => removePoLine(line.id)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
                      <X size={15} color="#9BA9A5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addPoLine} style={{ background: "transparent", border: "none", color: TEAL_DARK, fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "4px 0 10px" }}>
                <Plus size={13} /> Add line
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={createPo} style={{ flex: 1, background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Save order</button>
                <button onClick={() => { setCreatingPo(false); setPoLines([{ id: uid(), productId: "", qty: "" }]); }} style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreatingPo(true)} disabled={(products || []).length === 0}
              style={{ width: "100%", padding: "11px 0", border: `1.5px dashed ${LINE}`, borderRadius: 12, background: "transparent", color: (products || []).length === 0 ? "#B7C3C0" : TEAL_DARK, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: (products || []).length === 0 ? "default" : "pointer", marginBottom: 12 }}>
              <Plus size={15} /> New purchase order
            </button>
          )}
          {(products || []).length === 0 && (
            <div style={{ fontSize: 12, color: "#8A9A96", textAlign: "center", marginTop: -6 }}>Add a product in the Stock tab first.</div>
          )}
        </div>
      )}

      {tab === "orders" && openPo_ && (
        <div style={{ padding: "8px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setOpenPoId(null)} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: TEAL_DARK, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 0 10px" }}>
              <ChevronLeft size={16} /> Orders
            </button>
            <button onClick={() => { if (deleteOrder(openPo_)) setOpenPoId(null); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: RUST, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "6px 0 10px" }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>

          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{openPo_.label}</div>
          <div style={{ fontSize: 12, color: "#7C8F8B", marginBottom: 10 }}>{openPo_.date}</div>

          <button onClick={() => toggleShipped(openPo_.id)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            border: `1.5px solid ${openPo_.shipped ? GOOD : LINE}`,
            background: openPo_.shipped ? "#E8F3EC" : "#fff",
            color: openPo_.shipped ? GOOD : "#5C726D",
            borderRadius: 10, padding: "9px 0", fontSize: 13.5, fontWeight: 600, marginBottom: 14, cursor: "pointer",
          }}>
            {openPo_.shipped ? <><Check size={15} /> Shipped</> : "Mark as shipped"}
          </button>

          {openPo_.status === "pending" ? (
            <button onClick={autoAllocateAll} style={{ width: "100%", background: TEAL, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13.5, fontWeight: 600, marginBottom: 14, cursor: "pointer" }}>
              Auto-allocate from available stock
            </button>
          ) : (
            <div style={{ background: openPo_.status === "fulfilled" ? "#E8F3EC" : "#FBEAE3", color: openPo_.status === "fulfilled" ? GOOD : RUST, fontSize: 12.5, fontWeight: 600, borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
              {openPo_.status === "fulfilled" ? "Fully allocated and deducted from stock." : "Partially allocated — some lines fell short of stock."}
            </div>
          )}

          {openPo_.lines.map((l) => {
            const prod = productById(l.productId);
            const available = prod ? prod.stock : 0;
            const locked = openPo_.status !== "pending";
            const allocated = locked ? l.qtyAllocated : (allocDraft[l.id] ?? 0);
            const remaining = available - allocated;
            const short = allocated < l.qtyOrdered;
            return (
              <div key={l.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{prod ? prod.name : "Unknown product"}</div>
                  <div style={{ fontSize: 12, color: "#7C8F8B" }}>Ordered {l.qtyOrdered}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#7C8F8B" }}>
                    In stock: {locked ? available + allocated : available}
                  </div>
                  {locked ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: short ? RUST : GOOD }}>
                      {allocated} allocated
                    </div>
                  ) : (
                    <input
                      value={allocDraft[l.id] ?? 0}
                      onChange={(e) => setLineAlloc(l.id, l.productId, e.target.value)}
                      inputMode="numeric"
                      style={{ width: 56, textAlign: "center", padding: "6px 0", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 14, fontWeight: 700 }}
                    />
                  )}
                </div>
                {!locked && (
                  <div style={{ fontSize: 11.5, color: remaining < 0 ? RUST : "#7C8F8B", marginTop: 6 }}>
                    Remaining stock after assigning: {Math.max(0, available - (allocDraft[l.id] ?? 0))}
                  </div>
                )}
                {short && (
                  <div style={{ fontSize: 11.5, color: RUST, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={12} /> Short by {l.qtyOrdered - allocated}
                  </div>
                )}
              </div>
            );
          })}

          {openPo_.status === "pending" && (
            <button onClick={confirmAllocation} style={{ width: "100%", background: INK, color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 600, marginTop: 4, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
              <Check size={15} /> Confirm &amp; deduct from stock
            </button>
          )}
        </div>
      )}
    </div>
  );
}
