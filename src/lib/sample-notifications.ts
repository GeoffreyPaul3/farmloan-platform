import { createNotification, createNotificationForAdmins, notificationTemplates } from "./notifications";

export async function createSampleNotifications(userId: string) {
  try {
    // Create some sample notifications for the current user
    await createNotification({
      user_id: userId,
      title: "Welcome to Farm Manager!",
      message: "Your account has been successfully set up. You can now start managing farmers, loans, and equipment.",
      type: "success",
      action_url: "/dashboard",
    });

    await createNotification({
      user_id: userId,
      title: "System Update",
      message: "The platform has been updated with new features including real-time notifications and improved reporting.",
      type: "info",
      action_url: "/admin",
    });

    await createNotification({
      user_id: userId,
      title: "Pending Actions",
      message: "You have 5 pending farmer registrations that require your attention.",
      type: "warning",
      action_url: "/farmers",
    });

    // Create some sample notifications for admins
    await createNotificationForAdmins({
      title: "New User Registration",
      message: "A new staff member has registered and is awaiting approval.",
      type: "info",
      action_url: "/admin",
    });

    await createNotificationForAdmins({
      title: "System Maintenance",
      message: "Scheduled maintenance will occur tonight at 2:00 AM. The system will be unavailable for 30 minutes.",
      type: "warning",
    });

    console.log("Sample notifications created successfully");
  } catch (error) {
    console.error("Failed to create sample notifications:", error);
  }
}

export async function createActivityNotifications() {
  try {
    // Simulate some activity-based notifications
    await createNotificationForAdmins({
      title: "High Loan Volume",
      message: "Loan applications have increased by 25% this week. Consider reviewing the approval process.",
      type: "info",
      action_url: "/loans",
    });

    await createNotificationForAdmins({
      title: "Equipment Check-in Due",
      message: "Several equipment items are due for return this week. Please follow up with farmers.",
      type: "warning",
      action_url: "/equipment",
    });

    console.log("Activity notifications created successfully");
  } catch (error) {
    console.error("Failed to create activity notifications:", error);
  }
}
