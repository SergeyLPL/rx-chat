import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function CreateGroup({ currentUser, onCreated, onClose }) {
  const [groupName, setGroupName] = useState('')
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDocs(collection(db, 'users')).then((snap) => {
      setUsers(
        snap.docs
          .map((d) => d.data())
          .filter((u) => u.uid !== currentUser.uid)
      )
    })
  }, [currentUser.uid])

  function toggleUser(uid) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  async function handleCreate() {
    if (!groupName.trim()) { setError('Введите название группы'); return }
    if (selected.size < 2) { setError('Выберите минимум 2 участника'); return }
    setError('')
    setLoading(true)
    try {
      const members = [currentUser.uid, ...Array.from(selected)]
      const ref = await addDoc(collection(db, 'chats'), {
        type: 'group',
        displayName: groupName.trim(),
        members,
        adminUid: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
      })
      onCreated({ id: ref.id, type: 'group', displayName: groupName.trim(), members })
    } catch (err) {
      setError('Ошибка создания группы: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter((u) =>
    (u.displayName || u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-[#202c33] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a3942]">
          <button onClick={onClose} className="text-[#8696a0] hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/>
            </svg>
          </button>
          <h2 className="text-white font-medium">Новая группа</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Group name input */}
          <div className="px-5 py-4 border-b border-[#2a3942]">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#2a3942] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#8696a0]">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Название группы"
                maxLength={50}
                className="flex-1 bg-transparent border-b border-[#4a5568] focus:border-[#00a884] text-white text-base outline-none py-1 placeholder-[#8696a0] transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Members count */}
          <div className="px-5 pt-3 pb-1">
            <p className="text-[#00a884] text-xs font-semibold uppercase tracking-wider">
              Участники: {selected.size}/
              {users.length} &nbsp;
              <span className="text-[#8696a0] normal-case font-normal">(минимум 2)</span>
            </p>
          </div>

          {/* Search users */}
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2 bg-[#2a3942] rounded-lg px-3 py-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#8696a0] flex-shrink-0">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск пользователей..."
                className="bg-transparent text-white text-sm outline-none flex-1 placeholder-[#8696a0]"
              />
            </div>
          </div>

          {/* Selected chips */}
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-2 px-5 pb-2">
              {users
                .filter((u) => selected.has(u.uid))
                .map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => toggleUser(u.uid)}
                    className="flex items-center gap-1.5 bg-[#00a884]/20 text-[#00a884] text-xs rounded-full px-3 py-1.5 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    {u.displayName || u.email.split('@')[0]}
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                ))}
            </div>
          )}

          {/* User list */}
          <div>
            {filtered.length === 0 ? (
              <p className="text-center text-[#8696a0] text-sm py-6">Нет пользователей</p>
            ) : (
              filtered.map((u) => {
                const isSelected = selected.has(u.uid)
                const initial = (u.displayName || u.email || '?')[0].toUpperCase()
                return (
                  <button
                    key={u.uid}
                    onClick={() => toggleUser(u.uid)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#2a3942] transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#6c757d] flex items-center justify-center text-white font-semibold text-lg">
                        {u.photoURL ? (
                          <img src={u.photoURL} className="w-12 h-12 rounded-full object-cover" alt="" />
                        ) : initial}
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00a884] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {u.displayName || u.email.split('@')[0]}
                      </p>
                      <p className="text-[#8696a0] text-xs truncate">{u.email}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-[#00a884] bg-[#00a884]' : 'border-[#8696a0]'
                    }`}>
                      {isSelected && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2a3942]">
          {error && (
            <p className="text-red-400 text-sm mb-3 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selected.size < 2}
            className="w-full bg-[#00a884] hover:bg-[#06cf9c] disabled:bg-[#374045] disabled:text-[#8696a0] text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {loading
              ? 'Создание...'
              : `Создать группу${selected.size >= 2 ? ` (${selected.size + 1} участника)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
