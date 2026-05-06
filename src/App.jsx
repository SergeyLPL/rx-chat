import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

export default function App() {
  const user = useAuth()
  const [activeChat, setActiveChat] = useState(null)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#111b21] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  function handleSelectChat(chat) {
    setActiveChat(chat)
    setMobileChatOpen(true)
  }

  return (
    <div className="flex h-screen bg-[#111b21] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          mobileChatOpen ? 'hidden' : 'flex'
        } md:flex flex-col w-full md:w-96 lg:w-[380px] flex-shrink-0`}
      >
        <Sidebar
          currentUser={user}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Chat area */}
      <div
        className={`${
          mobileChatOpen ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col min-w-0`}
      >
        {activeChat ? (
          <ChatWindow
            key={activeChat.id}
            chat={activeChat}
            currentUser={user}
            onBack={() => setMobileChatOpen(false)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-[#00a884]/20 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#00a884]">
          <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.18 1.6 6L0 24l6.3-1.65A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.67-.5-5.25-1.45l-.38-.22-3.9 1.02 1.04-3.8-.25-.4A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2c2.68 0 5.19 1.04 7.08 2.93A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.91-2.2-.24-.57-.49-.5-.67-.5-.17 0-.37-.02-.57-.02s-.52.07-.8.37c-.27.3-1.04 1.02-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.62.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
        </svg>
      </div>
      <h2 className="text-white text-xl font-light mb-2">RX Chat</h2>
      <p className="text-[#8696a0] text-sm max-w-xs">
        Выберите чат или найдите пользователя, чтобы начать общение
      </p>
    </div>
  )
}
