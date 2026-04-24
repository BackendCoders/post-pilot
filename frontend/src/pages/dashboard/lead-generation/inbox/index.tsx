import React, { useState, useEffect, useRef } from 'react';
import { useConversations, useMessageThread, useSendReply, useMarkAsRead } from '@/query/leadMessage.query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Search, 
  ArrowLeft,
  MessageSquare,
  Clock,
  FileText,
  Info
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '@/context/SocketContext';
import ReachDialog from '../components/ReachDialog';
import LeadDetailsPanel from '../components/LeadDetailsPanel';

const LeadInbox = () => {
  const [searchParams] = useSearchParams();
  const initialLeadId = searchParams.get('leadId');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReachDialogOpen, setIsReachDialogOpen] = useState(false);
  
  const { isConnected } = useSocket();
  const { data: conversations, isLoading: isConversationsLoading } = useConversations();
  const { data: messages, isLoading: isMessagesLoading } = useMessageThread(selectedLeadId || '');
  const { mutate: sendReply, isPending: isSending } = useSendReply();
  const { mutate: markAsRead } = useMarkAsRead();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedLeadId) {
      markAsRead(selectedLeadId);
    }
  }, [selectedLeadId, markAsRead]);

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedLeadId) return;
    
    sendReply({ leadId: selectedLeadId, text: replyText });
  };

  const filteredConversations = conversations?.filter(conv => {
    const name = (conv.leadInfo.title || '').toLowerCase();
    const phone = conv.leadInfo.phone || '';
    const category = (conv.leadInfo.categoryName || conv.leadInfo.category || '').toLowerCase();
    const status = conv.leadInfo.status;
    
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || 
                          phone.includes(searchQuery) || 
                          category.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const selectedConversation = conversations?.find(c => c._id === selectedLeadId);

  const groupedMessages = messages?.reduce((groups: any, message) => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-background/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden shadow-2xl">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-border flex flex-col bg-card/30 transition-all duration-300",
        selectedLeadId && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-border bg-background/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Messages</h1>
              <div className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
            </div>
            <Badge variant="outline" className="text-[10px]">LEADS ONLY</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search leads..." 
                className="pl-9 h-9 bg-background/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
              {['all', 'new', 'saved', 'processed', 'converted', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all",
                    statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
          {isConversationsLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-3 space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div>
              </div>
            ))
          ) : filteredConversations?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No messages found</p>
            </div>
          ) : (
            filteredConversations?.map((conv) => (
              <button
                key={conv._id}
                onClick={() => setSelectedLeadId(conv._id)}
                className={cn(
                  "w-full flex items-start p-3 rounded-xl transition-all duration-300 group",
                  selectedLeadId === conv._id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50"
                )}
              >
                <Avatar className="h-12 w-12 border-2 border-background">
                  {conv.leadInfo.thumbnailUrl ? (
                    <img src={conv.leadInfo.thumbnailUrl} alt={conv.leadInfo.title} className="object-cover w-full h-full" />
                  ) : (
                    <AvatarFallback>{conv.leadInfo.title?.[0] || 'L'}</AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-3 flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{conv.leadInfo.title}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="px-1.5 py-0 text-[8px] font-bold uppercase">{conv.leadInfo.categoryName || conv.leadInfo.category || 'Lead'}</Badge>
                    <div className={cn("h-1.5 w-1.5 rounded-full", conv.leadInfo.status === 'converted' ? "bg-green-500" : "bg-amber-500")} />
                  </div>
                  <p className="text-xs truncate text-muted-foreground mt-1">
                    {conv.lastMessage.direction === 'outgoing' ? 'You: ' : ''}{conv.lastMessage.content}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-background/20 relative",
        !selectedLeadId && "hidden md:flex items-center justify-center"
      )}>
        {selectedLeadId ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-md">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setSelectedLeadId(null)}><ArrowLeft className="h-5 w-5" /></Button>
                <div className="relative cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
                  <Avatar className="h-10 w-10">
                    {selectedConversation?.leadInfo.thumbnailUrl ? (
                      <img src={selectedConversation.leadInfo.thumbnailUrl} alt={selectedConversation.leadInfo.title} className="object-cover w-full h-full" />
                    ) : (
                      <AvatarFallback>{selectedConversation?.leadInfo.title?.[0] || 'L'}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="ml-3">
                  <h2 className="text-sm font-bold">{selectedConversation?.leadInfo.title}</h2>
                  <div className="flex items-center mt-1 space-x-2 text-[10px] text-muted-foreground">
                    <span>{selectedConversation?.leadInfo.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={() => setShowDetails(!showDetails)} className={cn(showDetails && "bg-primary/10 text-primary")}>
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
              <div className="space-y-6 max-w-4xl mx-auto">
                {isMessagesLoading ? (
                  <div className="flex justify-center p-8"><Clock className="animate-spin h-6 w-6 opacity-20" /></div>
                ) : groupedMessages && Object.keys(groupedMessages).map((date) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center"><span className="px-3 py-1 rounded-full bg-background/80 text-[10px] font-bold uppercase">{getDateLabel(date)}</span></div>
                    {groupedMessages[date].map((msg: any) => (
                      <div key={msg._id} className={cn("flex w-full", msg.direction === 'outgoing' ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm border", msg.direction === 'outgoing' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card rounded-tl-none")}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className="text-[9px] mt-1 opacity-70 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 bg-background/50 border-t border-border">
              <div className="max-w-4xl mx-auto space-y-3">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-full text-[10px] font-bold"
                    onClick={() => setIsReachDialogOpen(true)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Use Template
                  </Button>
                </div>
                <form onSubmit={handleSendReply} className="flex items-center space-x-2">
                  <Input 
                    placeholder="Type a message..." 
                    className="flex-1 bg-background/80 h-12 rounded-2xl"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isSending}
                  />
                  <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl" disabled={!replyText.trim() || isSending}>
                    {isSending ? <Clock className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold">Select a conversation</h2>
          </div>
        )}
      </div>

      {/* Details Sidebar */}
      {selectedLeadId && showDetails && (
        <LeadDetailsPanel 
          lead={selectedConversation?.leadInfo as Partial<ILead> || null} 
          onClose={() => setShowDetails(false)} 
        />
      )}

      {/* Reach Dialog */}
      <ReachDialog 
        isOpen={isReachDialogOpen}
        onClose={() => setIsReachDialogOpen(false)}
        selectedLeads={selectedConversation ? [selectedConversation.leadInfo as Partial<ILead>] : []}
      />
    </div>
  );
};

export default LeadInbox;
