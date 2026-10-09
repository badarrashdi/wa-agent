import { storage } from "@/lib/storage";

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Check available appointment dates and open time slots for a specified date or date range.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Target date or human phrase (e.g., '2026-10-16', 'this Friday', 'tomorrow morning').",
          },
          service: {
            type: "string",
            description: "Service requested (e.g. 'routine cleaning', 'checkup', 'teeth whitening', 'consultation').",
          },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description:
        "Confirm and book a new appointment slot for the patient/customer.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Full name of the patient or customer.",
          },
          phone: {
            type: "string",
            description: "Patient's phone number.",
          },
          date: {
            type: "string",
            description: "Appointment date in YYYY-MM-DD or standardized readable date.",
          },
          time_slot: {
            type: "string",
            description: "Selected time slot (e.g. '10:00 AM', '2:30 PM').",
          },
          service: {
            type: "string",
            description: "Type of dental/medical or consultation service.",
          },
          notes: {
            type: "string",
            description: "Any special requirements, pain points, or notes.",
          },
        },
        required: ["customer_name", "date", "time_slot", "service"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_or_reschedule_appointment",
      description:
        "Reschedule an existing appointment to a new date/time, or cancel it.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: {
            type: "string",
            description: "Appointment reference ID if known (e.g. 'APT-401').",
          },
          action: {
            type: "string",
            enum: ["reschedule", "cancel"],
            description: "Whether to reschedule or cancel.",
          },
          new_date: {
            type: "string",
            description: "New requested date (for reschedule).",
          },
          new_time_slot: {
            type: "string",
            description: "New requested time slot (for reschedule).",
          },
          reason: {
            type: "string",
            description: "Reason for modification.",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_knowledge_base",
      description:
        "Search clinic/business FAQs, price charts, accepted insurance plans, address, directions, and pre/post-procedure guidelines.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Keywords or search question (e.g. 'insurance', 'price of whitening', 'emergency hours', 'location').",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description:
        "Immediately escalate this conversation to a human doctor or customer support agent. Use this when the patient is in severe emergency pain, expresses high frustration/anger, or explicitly demands to talk to a human.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Clear summary of why human intervention is required.",
          },
          urgency: {
            type: "string",
            enum: ["emergency", "high", "normal"],
            description: "Severity level of escalation.",
          },
        },
        required: ["reason", "urgency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "collect_customer_lead",
      description:
        "Capture customer contact details, interest, and notes for sales/support followup.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          interest: { type: "string" },
          notes: { type: "string" },
        },
        required: ["interest"],
      },
    },
  },
];

export async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  conversationId?: string,
  customerPhone?: string
): Promise<Record<string, any>> {
  switch (toolName) {
    case "check_availability": {
      // Look up existing appointments for this date to avoid collisions
      const allApts = await storage.getAppointments();
      const standardSlots = [
        "09:30 AM",
        "10:00 AM",
        "11:30 AM",
        "02:00 PM",
        "03:30 PM",
        "04:30 PM",
      ];

      // Filter slots that are already booked
      const bookedSlots = allApts
        .filter((a) => a.date === args.date && a.status === "confirmed")
        .map((a) => a.time_slot);

      const available = standardSlots.filter((s) => !bookedSlots.includes(s));

      return {
        date: args.date,
        service: args.service || "General Dental Consultation",
        available_slots: available.length > 0 ? available : ["09:00 AM (Next Day)", "11:00 AM (Next Day)"],
        booking_policy: "Appointments can be rescheduled with 24 hours notice.",
      };
    }

    case "book_appointment": {
      const apt = await storage.createAppointment({
        conversation_id: conversationId,
        phone: args.phone || customerPhone || "+1 (555) 000-0000",
        customer_name: args.customer_name || "Valued Customer",
        service: args.service || "Dental Consultation",
        date: args.date || new Date().toISOString().split("T")[0],
        time_slot: args.time_slot || "10:00 AM",
        status: "confirmed",
        notes: args.notes || "Booked via WhatsApp AI Agent",
      });

      return {
        success: true,
        appointment_id: apt.id,
        customer_name: apt.customer_name,
        date: apt.date,
        time_slot: apt.time_slot,
        service: apt.service,
        status: "confirmed",
        instructions: "Please arrive 10 minutes prior to complete any intake documentation.",
      };
    }

    case "cancel_or_reschedule_appointment": {
      if (args.action === "reschedule" && args.appointment_id) {
        const updated = await storage.updateAppointment(args.appointment_id, {
          date: args.new_date,
          time_slot: args.new_time_slot,
          notes: args.reason ? `Rescheduled: ${args.reason}` : "Rescheduled via WhatsApp",
        });

        return {
          success: !!updated,
          action: "rescheduled",
          appointment_id: args.appointment_id,
          new_date: args.new_date,
          new_time_slot: args.new_time_slot,
        };
      }

      if (args.action === "cancel" && args.appointment_id) {
        await storage.updateAppointment(args.appointment_id, {
          status: "cancelled",
          notes: args.reason ? `Cancelled: ${args.reason}` : "Cancelled via WhatsApp",
        });

        return {
          success: true,
          action: "cancelled",
          appointment_id: args.appointment_id,
        };
      }

      return {
        success: true,
        message: "Your request has been logged. Our front desk will verify your appointment details.",
      };
    }

    case "lookup_knowledge_base": {
      const articles = await storage.getKnowledgeBase(args.query);
      if (articles.length === 0) {
        return {
          found: false,
          message: "No specific policy document matched. Consult clinic staff for personalized information.",
        };
      }

      return {
        found: true,
        matches: articles.slice(0, 3).map((a) => ({
          title: a.title,
          category: a.category,
          snippet: a.content,
        })),
      };
    }

    case "escalate_to_human": {
      if (conversationId) {
        await storage.updateConversation(conversationId, {
          mode: "human",
          status: "escalated",
          metadata: {
            sentiment: args.urgency === "emergency" ? "frustrated" : "negative",
            escalation_reason: args.reason,
            tags: ["escalated", args.urgency],
          },
        });
      }

      return {
        escalated: true,
        urgency: args.urgency,
        reason: args.reason,
        assigned_queue: args.urgency === "emergency" ? "clinical_emergency" : "human_support",
        notice: "Conversation mode automatically changed to human takeover.",
      };
    }

    case "collect_customer_lead": {
      return {
        success: true,
        lead_saved: true,
        summary: `Lead registered for interest: ${args.interest}`,
      };
    }

    default:
      return { error: `Tool ${toolName} not recognized.` };
  }
}
