
import { api } from "./api";

export async function getNotifications() {
  const { data } = await api.get("/notifications");
  return data;
}

export async function markAllNotificationsRead() {
  await api.post("/notifications/mark-all-read");
}

export async function markNotificationRead(id) {
  await api.post(`/notifications/${id}/read`);
}
