import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../common/ui";
import api from "../../services/http/api";

export default function TicketThread({ ticketId, currentUserId, onSent }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const node = containerRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    });
  };

  const load = () => {
    setLoading(true);
    return api.get(`/tickets/${ticketId}/messages`)
      .then(({ data }) => {
        setMessages(data || []);
        scrollToBottom();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!ticketId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const send = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form).get("reply");
    try {
      await api.post(`/tickets/${ticketId}/messages`, { body });
      form.reset();
      await load();
      onSent?.();
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not send message.");
    }
  };

  return <div className="flex h-full min-h-0 flex-col">
    <div ref={containerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      {loading && <div className="text-sm text-muted">Loading messages...</div>}
      {!loading && messages.length === 0 && <div className="text-sm text-muted">No messages yet.</div>}
      {messages.map((message) => {
        const mine = message.senderId === currentUserId;
        return <div className={`flex ${mine ? "justify-end" : "justify-start"}`} key={message.id}>
          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${mine ? "bg-primary text-primary-foreground" : "bg-surface-raised"}`}>
            {!mine && <div className="mb-1 text-xs font-bold opacity-70">{message.sender?.name || "Unknown"}</div>}
            <div>{message.body}</div>
          </div>
        </div>;
      })}
    </div>
    <form onSubmit={send} className="mt-4 flex shrink-0 gap-2">
      <input name="reply" required className="input" placeholder="Write a reply..."/>
      <Button><Send size={16}/></Button>
    </form>
  </div>;
}
