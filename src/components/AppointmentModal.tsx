"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, Plus, Trash2, CheckCircle2, User, Phone } from "lucide-react";
import { Appointment } from "@/lib/types";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultName?: string;
  conversationId?: string;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  defaultPhone = "",
  defaultName = "",
  conversationId,
}: AppointmentModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  // Form fields
  const [customerName, setCustomerName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [service, setService] = useState("Routine Cleaning & Checkup");
  const [date, setDate] = useState("2026-10-16");
  const [timeSlot, setTimeSlot] = useState("10:00 AM");

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
      setCustomerName(defaultName);
      setPhone(defaultPhone);
    }
  }, [isOpen, defaultPhone, defaultName]);

  async function loadAppointments() {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed loading appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || !phone || !date || !timeSlot) return;

    try {
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          service,
          date,
          time_slot: timeSlot,
          conversation_id: conversationId,
        }),
      });
      setShowNewForm(false);
      loadAppointments();
    } catch (err) {
      console.error("Create appointment error:", err);
    }
  }

  async function handleCancel(id: string) {
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      loadAppointments();
    } catch (err) {
      console.error("Cancel appointment error:", err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1f23]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Appointment Manager</h2>
              <p className="text-xs text-zinc-400">
                View & manage appointments booked via AI Agent and manual operator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Appointments ({appointments.length})
            </span>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNewForm ? "Cancel Form" : "Book New Slot"}</span>
            </button>
          </div>

          {/* New Appointment Form */}
          {showNewForm && (
            <form onSubmit={handleCreateAppointment} className="bg-[#121214] border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400">Book New Appointment Slot</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Service</label>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    required
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-semibold text-white transition"
              >
                Confirm Booking
              </button>
            </form>
          )}

          {/* Appointments List */}
          <div className="space-y-2.5">
            {appointments.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">No appointments booked yet.</p>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                    apt.status === "cancelled"
                      ? "bg-[#141416] border-white/5 opacity-50"
                      : "bg-[#202024] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{apt.customer_name}</span>
                      <span className="text-[11px] font-mono text-zinc-400">({apt.phone})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          apt.status === "confirmed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {apt.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-300 flex items-center gap-3">
                      <span className="text-emerald-400 font-medium">{apt.service}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {apt.time_slot}
                      </span>
                    </div>
                    {apt.notes && <p className="text-[11px] text-zinc-500">{apt.notes}</p>}
                  </div>

                  {apt.status === "confirmed" && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5 transition"
                      title="Cancel appointment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-white/10 bg-[#1f1f23]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
