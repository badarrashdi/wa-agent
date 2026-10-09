import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const messages = await storage.getMessages(id);
    return Response.json(messages);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
