import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";
import { DEFAULT_PERSONAS } from "@/lib/ai/personas";

export async function GET() {
  try {
    const settings = await storage.getSettings();
    return Response.json({
      settings,
      personas: Object.values(DEFAULT_PERSONAS),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await storage.saveSettings(body);
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
