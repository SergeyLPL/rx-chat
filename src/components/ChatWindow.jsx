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
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export default function ChatWindow({ chat, currentUser, onBack }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // 0–100 or null
  const [lightbox, setLightbox] = useState(null) // image URL to show full-size
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [chat.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [chat.id])

  async function postMessage({ text: msgText = '', imageUrl = null }) {
    const senderName = currentUser.displayName || currentUser.email.split('@')[0]
    await addDoc(collection(db, 'chats', chat.id, 'messages'), {
      text: msgText,
      imageUrl,
      senderId: currentUser.uid,
      senderName,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'chats', chat.id), {
      lastMessage: {
        text: imageUrl ? (msgText || '📷 Фото') : msgText,
        senderId: currentUser.uid,
        senderName,
      },
      updatedAt: serverTimestamp(),
    })
  }

  async function sendText(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await postMessage({ text: trimmed })
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) sendText(e)
  }

  function handleFileClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Можно прикреплять только изображения')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('Файл слишком большой. Максимум 10 МБ')
      return
    }

    const ext = file.name.split('.').pop()
    const path = `chat-images/${chat.id}/${currentUser.uid}_${Date.now()}.${ext}`
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    setUploadProgress(0)

    uploadTask.on(
      'state_changed',
      (snap) => {
        setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
      },
      (err) => {
        console.error('Ошибка загрузки:', err)
        setUploadProgress(null)
        alert('Ошибка загрузки файла')
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        setUploadProgress(null)
        const caption = text.trim()
        setText('')
        await postMessage({ text: caption, imageUrl: url })
      }
    )
  }

  const displayName = chat.displayName || 'Чат'
  const isGroup = chat.type === 'group'
  const initial = displayName[0]?.toUpperCase()

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33] flex-shrink-0">
        <button onClick={onBack} className="md:hidden text-[#8696a0] hover:text-white p-1 mr-1">
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
          ) : initial}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{displayName}</p>
          {isGroup && chat.members && (
            <p className="text-[#8696a0] text-xs">{chat.members.length} участника</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ backgroundColor: '#0b141a' }}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-[#182229] rounded-lg px-4 py-2 text-[#8696a0] text-sm">
              Начните диалог — напишите первое сообщение
            </div>
          </div>
        )}

        {groupByDate(messages).map((group, gi) => (
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
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5`}>
                  <div
                    className={`message-bubble rounded-lg px-3 py-2 shadow ${
                      isMe
                        ? 'bg-[#005c4b] text-white rounded-tr-none'
                        : 'bg-[#202c33] text-white rounded-tl-none'
                    }`}
                  >
                    {showName && (
                      <p className="text-[#00a884] text-xs font-semibold mb-1">{msg.senderName}</p>
                    )}

                    {/* Image */}
                    {msg.imageUrl && (
                      <button
                        onClick={() => setLightbox(msg.imageUrl)}
                        className="block mb-1 rounded-md overflow-hidden hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={msg.imageUrl}
                          alt="фото"
                          className="max-w-full rounded-md"
                          style={{ maxHeight: 300, maxWidth: 280 }}
                          loading="lazy"
                        />
                      </button>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}

                    <p className={`text-xs mt-0.5 text-right ${isMe ? 'text-[#7fbdb4]' : 'text-[#8696a0]'}`}>
                      {msg.createdAt?.toDate
                        ? msg.createdAt.toDate().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
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

      {/* Upload progress bar */}
      {uploadProgress !== null && (
        <div className="px-4 py-2 bg-[#202c33] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#2a3942] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-[#00a884] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[#8696a0] text-xs flex-shrink-0">{uploadProgress}%</span>
          </div>
          <p className="text-[#8696a0] text-xs mt-1">Загрузка изображения...</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendText} className="flex items-end gap-2 px-4 py-3 bg-[#202c33] flex-shrink-0">
        {/* Image attach button */}
        <button
          type="button"
          onClick={handleFileClick}
          disabled={uploadProgress !== null}
          title="Прикрепить фото"
          className="w-10 h-10 rounded-full text-[#8696a0] hover:text-white hover:bg-[#374045] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={uploadProgress !== null ? 'Загрузка...' : 'Введите сообщение...'}
          disabled={uploadProgress !== null}
          rows={1}
          className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-3 text-sm outline-none resize-none placeholder-[#8696a0] max-h-32 overflow-y-auto disabled:opacity-60"
          style={{ height: 'auto' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
        />

        <button
          type="submit"
          disabled={!text.trim() || sending || uploadProgress !== null}
          className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#06cf9c] disabled:bg-[#374045] flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <img
            src={lightbox}
            alt="фото"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function groupByDate(messages) {
  const groups = []
  let curDate = null
  let curGroup = null
  for (const msg of messages) {
    const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date()
    const key = date.toDateString()
    if (key !== curDate) {
      curDate = key
      curGroup = { label: formatDateLabel(date), messages: [] }
      groups.push(curGroup)
    }
    curGroup.messages.push(msg)
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
