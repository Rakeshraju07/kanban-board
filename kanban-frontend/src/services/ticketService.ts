import { api } from "../api/axios";
import type { Ticket } from "../types/ticket";

export const fetchTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get("/tickets");
  return data;
};

export const updateTicketStatus = async (
  id: number,
  status: string
): Promise<Ticket> => {
  const { data } = await api.put(
    `/tickets/${id}/status?status=${status}`
  );

  return data;
};

export const createTicket = async (ticket: any) => {
  const { data } = await api.post("/tickets", ticket);
  return data;
};

export const fetchUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};