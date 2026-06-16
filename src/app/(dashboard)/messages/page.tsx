import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your recruiter messages and outreach</p>
      </div>
      <div className="glass rounded-xl p-12 text-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">No messages yet</p>
        <p className="text-xs text-muted-foreground">Messages from recruiters will appear here.</p>
      </div>
    </div>
  );
}
