'use client'

import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import type { Message, Profile } from '@/types'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params)
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [amUser1, setAmUser1] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadChat() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: conv } = await supabase
      .from('conversations')
      .select('*, user1:profiles!conversations_user1_id_fkey(*), user2:profiles!conversations_user2_id_fkey(*)')
      .eq('id', conversationId)
      .single()

    if (conv) {
      const isUser1 = conv.user1_id === user.id
      setAmUser1(isUser1)
      setOtherUser((isUser1 ? conv.user2 : conv.user1) as Profile)

      // Mark conversation as read
      await supabase.from('conversations').update(
        isUser1 ? { user1_read_at: new Date().toISOString() } : { user2_read_at: new Date().toISOString() }
      ).eq('id', conversationId)
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgs) setMessages(msgs as Message[])
    setLoading(false)

    // Realtime
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending) return

    setSending(true)
    const text = content.trim()
    setContent('')

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text,
    }).select().single()

    if (!error && data) {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev
        return [...prev, data as Message]
      })
    }

    // Update conversation with last message info
    const now = new Date().toISOString()
    await supabase.from('conversations').update({
      last_message_at: now,
      last_message_content: text,
      last_message_sender_id: currentUserId,
      ...(amUser1 ? { user1_read_at: now } : { user2_read_at: now }),
    }).eq('id', conversationId)

    // Create inbox notification with message content
    if (otherUser) {
      await supabase.from('notifications').insert({
        user_id: otherUser.id,
        actor_id: currentUserId,
        type: 'message',
        content: text,
      })
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-bg" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: '56px', zIndex: 20 }}>
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="bg-bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <Link href="/messages" className="press">
            <ArrowLeft size={20} />
          </Link>
          {otherUser && (
            <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-2.5 press">
              <div className="w-8 h-8 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
                {otherUser.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-text-muted">
                    {otherUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <span className="text-[15px] font-semibold">{otherUser.full_name}</span>
            </Link>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-text-muted text-[13px] py-8">No messages yet. Say hi!</p>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[14px] ${
                  msg.sender_id === currentUserId
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-bg-card border border-border rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${
                  msg.sender_id === currentUserId ? 'text-white/60' : 'text-text-muted'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-border px-4 py-3 flex gap-2 flex-shrink-0 bg-bg">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-bg-input rounded-full px-4 py-2 text-[14px] outline-none border-none placeholder:text-text-muted/50"
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="bg-accent text-white rounded-full p-2.5 press disabled:opacity-50 flex-shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  )
}
