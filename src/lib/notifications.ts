import { supabase } from "@/integrations/supabase/client";

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  action_url?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase
    .from("notifications")
    .insert([{
      user_id: params.user_id,
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      action_url: params.action_url,
      metadata: params.metadata,
    }]);

  if (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function createNotificationForAllUsers(params: Omit<CreateNotificationParams, 'user_id'>) {
  // Get all user IDs
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("user_id");

  if (usersError) {
    console.error("Failed to fetch users:", usersError);
    throw usersError;
  }

  if (!users || users.length === 0) return;

  // Create notifications for all users
  const notifications = users.map(user => ({
    user_id: user.user_id,
    title: params.title,
    message: params.message,
    type: params.type,
    read: false,
    action_url: params.action_url,
    metadata: params.metadata,
  }));

  const { error } = await supabase
    .from("notifications")
    .insert(notifications);

  if (error) {
    console.error("Failed to create notifications for all users:", error);
    throw error;
  }
}

export async function createNotificationForAdmins(params: Omit<CreateNotificationParams, 'user_id'>) {
  // Get all admin user IDs
  const { data: admins, error: adminsError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "admin");

  if (adminsError) {
    console.error("Failed to fetch admins:", adminsError);
    throw adminsError;
  }

  if (!admins || admins.length === 0) return;

  // Create notifications for all admins
  const notifications = admins.map(admin => ({
    user_id: admin.user_id,
    title: params.title,
    message: params.message,
    type: params.type,
    read: false,
    action_url: params.action_url,
    metadata: params.metadata,
  }));

  const { error } = await supabase
    .from("notifications")
    .insert(notifications);

  if (error) {
    console.error("Failed to create notifications for admins:", error);
    throw error;
  }
}

// Predefined notification templates
export const notificationTemplates = {
  farmerRegistered: (farmerName: string) => ({
    title: "New Farmer Registration",
    message: `Farmer ${farmerName} has been registered successfully.`,
    type: "success" as const,
    action_url: "/farmers",
  }),

  loanCreated: (farmerName: string, amount: number) => ({
    title: "New Loan Created",
    message: `A new loan of $${amount} has been created for ${farmerName}.`,
    type: "info" as const,
    action_url: "/loans",
  }),

  deliveryProcessed: (farmerName: string, weight: number) => ({
    title: "Delivery Processed",
    message: `${weight}kg of cotton has been delivered by ${farmerName}.`,
    type: "success" as const,
    action_url: "/deliveries",
  }),

  equipmentIssued: (equipmentName: string, farmerName: string) => ({
    title: "Equipment Issued",
    message: `${equipmentName} has been issued to ${farmerName}.`,
    type: "info" as const,
    action_url: "/equipment",
  }),

  paymentReceived: (farmerName: string, amount: number) => ({
    title: "Payment Received",
    message: `Payment of $${amount} has been received from ${farmerName}.`,
    type: "success" as const,
    action_url: "/payments",
  }),

  systemAlert: (message: string) => ({
    title: "System Alert",
    message,
    type: "warning" as const,
  }),

  errorOccurred: (operation: string) => ({
    title: "Error Occurred",
    message: `An error occurred while ${operation}. Please check the system.`,
    type: "error" as const,
  }),
};
