import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const convos = await storage.getConversations();
    return Response.json(convos);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name } = body;

    if (!phone) {
      return Response.json({ error: "Phone number is required" }, { status: 400 });
    }

    const conversation = await storage.createConversation({
      phone,
      name: name || null,
      mode: "agent",
      status: "active",
    });

    return Response.json(conversation);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
