import { useState, useEffect, useRef } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export default function ChatWindow({ chat, currentUser, onBack }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [chat.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [chat.id])

  async function sendMessage(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        text: trimmed,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email.split('@')[0],
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: {
          text: trimmed,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email.split('@')[0],
        },
        updatedAt: serverTimestamp(),
      })
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage(e)
    }
  }

  const displayName = chat.displayName || 'Чат'
  const isGroup = chat.type === 'group'
  const initial = displayName[0]?.toUpperCase()

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33] flex-shrink-0">
        <button
          onClick={onBack}
          className="md:hidden text-[#8696a0] hover:text-white p-1 mr-1"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>

        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${isGroup ? 'bg-[#7c4dff]' : 'bg-[#6c757d]'}`}>
          {chat.photoURL ? (
            <img src={chat.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />
          ) : isGroup ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          ) : (
            initial
          )}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{displayName}</p>
          {isGroup && chat.members && (
            <p className="text-[#8696a0] text-xs">{chat.members.length} участника</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'300\' height=\'300\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3C/svg%3E")', backgroundColor: '#0b141a' }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-[#182229] rounded-lg px-4 py-2 text-[#8696a0] text-sm">
              Начните диалог — напишите первое сообщение
            </div>
          </div>
        )}

        {groupMessagesByDate(messages).map((group, gi) => (
          <div key={gi}>
            <div className="flex justify-center my-3">
              <span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-full">
                {group.label}
              </span>
            </div>
            {group.messages.map((msg, mi) => {
              const isMe = msg.senderId === currentUser.uid
              const showName =
                !isMe &&
                (isGroup || mi === 0 || group.messages[mi - 1]?.senderId !== msg.senderId)

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5`}
                >
                  <div
                    className={`message-bubble rounded-lg px-3 py-2 shadow ${
                      isMe
                        ? 'bg-[#005c4b] text-white rounded-tr-none'
                        : 'bg-[#202c33] text-white rounded-tl-none'
                    }`}
                  >
                    {showName && (
                      <p className="text-[#00a884] text-xs font-semibold mb-0.5">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-0.5 text-right ${isMe ? 'text-[#7fbdb4]' : 'text-[#8696a0]'}`}>
                      {msg.createdAt?.toDate
                        ? msg.createdAt.toDate().toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-end gap-2 px-4 py-3 bg-[#202c33] flex-shrink-0"
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          rows={1}
          className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-3 text-sm outline-none resize-none placeholder-[#8696a0] max-h-32 overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#06cf9c] disabled:bg-[#374045] flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

function groupMessagesByDate(messages) {
  const groups = []
  let currentDate = null
  let currentGroup = null

  for (const msg of messages) {
    const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date()
    const dateStr = date.toDateString()

    if (dateStr !== currentDate) {
      currentDate = dateStr
      currentGroup = { label: formatDateLabel(date), messages: [] }
      groups.push(currentGroup)
    }
    currentGroup.messages.push(msg)
  }
  return groups
}

function formatDateLabel(date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today - 86400000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return 'Сегодня'
  if (d.getTime() === yesterday.getTime()) return 'Вчера'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
