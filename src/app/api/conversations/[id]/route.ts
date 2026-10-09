import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const convo = await storage.getConversationById(id);
  if (!convo) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
  return Response.json(convo);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.mode && !["agent", "human"].includes(body.mode)) {
    return Response.json({ error: "Invalid mode. Must be 'agent' or 'human'" }, { status: 400 });
  }

  const updated = await storage.updateConversation(id, {
    ...(body.mode && { mode: body.mode }),
    ...(body.status && { status: body.status }),
    ...(body.name && { name: body.name }),
    ...(body.metadata && { metadata: body.metadata }),
  });

  if (!updated) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  return Response.json(updated);
}
