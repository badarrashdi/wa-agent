import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phone = searchParams.get("phone") || undefined;
  try {
    const appointments = await storage.getAppointments(phone);
    return Response.json(appointments);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apt = await storage.createAppointment({
      customer_name: body.customer_name,
      phone: body.phone,
      service: body.service,
      date: body.date,
      time_slot: body.time_slot,
      status: body.status || "confirmed",
      notes: body.notes,
      conversation_id: body.conversation_id,
    });
    return Response.json(apt);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return Response.json({ error: "Missing appointment ID" }, { status: 400 });
    const updated = await storage.updateAppointment(id, updates);
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
