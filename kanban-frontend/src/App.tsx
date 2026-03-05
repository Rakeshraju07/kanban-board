import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchTickets,
  updateTicketStatus,
  createTicket,
  fetchUsers,
} from "./services/ticketService";
import type { Ticket } from "./types/ticket";
import { useState } from "react";

function App() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);

  const { data: tickets = [], isLoading, error } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error loading tickets</div>;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const ticketId = parseInt(active.id as string);
    const newStatus = over.id as string;

    updateMutation.mutate({ id: ticketId, status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 p-8">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        Kanban Board
      </h1>

      <button
        onClick={() => setShowModal(true)}
        className="mb-8 bg-indigo-600 hover:bg-indigo-700 transition text-white px-5 py-2 rounded-lg shadow-md"
      >
        + Add Task
      </button>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-8">
          <Column title="TODO" tickets={tickets} />
          <Column title="IN_PROGRESS" tickets={tickets} />
          <Column title="DONE" tickets={tickets} />
        </div>
      </DndContext>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create Ticket</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                createMutation.mutate({
                  title: formData.get("title"),
                  description: formData.get("description"),
                  priority: formData.get("priority"),
                  status: "TODO",
                  teamId: 1,
                  assigneeId: assigneeId,
                });

                setShowModal(false);
                setAssigneeId(null);
              }}
              className="space-y-3"
            >
              <input
                name="title"
                placeholder="Title"
                required
                className="w-full border p-2 rounded-lg"
              />

              <textarea
                name="description"
                placeholder="Description"
                className="w-full border p-2 rounded-lg"
              />

              <select
                name="priority"
                className="w-full border p-2 rounded-lg"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>

              <select
                className="w-full border p-2 rounded-lg"
                onChange={(e) =>
                  setAssigneeId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Select Assignee</option>
                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-lg w-full shadow"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  title,
  tickets,
}: {
  title: string;
  tickets: Ticket[];
}) {
  const { setNodeRef } = useDroppable({
    id: title,
  });

  const filtered = tickets.filter((t) => t.status === title);

  return (
    <div
      ref={setNodeRef}
      className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 min-h-[450px]"
    >
      <h2 className="text-xl font-semibold mb-5 text-gray-700">
        {title}
      </h2>

      {filtered.map((ticket) => (
        <DraggableCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

function DraggableCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id.toString(),
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-xl p-4 mb-4 shadow-md border cursor-grab hover:shadow-lg transition"
    >
      <h3 className="font-semibold text-gray-800">
        {ticket.title}
      </h3>
      <p className="text-sm text-gray-600 mt-1">
        {ticket.description}
      </p>

      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <p>Priority: {ticket.priority}</p>
        <p>
          Assignee: {ticket.assignee?.name ?? "Unassigned"}
        </p>
        {ticket.createdAt && (
          <p>
            Created:{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;