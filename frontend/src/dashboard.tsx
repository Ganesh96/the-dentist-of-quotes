import React, { useEffect, useState } from 'react'
import { getProfile, updateProfile } from './api'

export default function Dashboard() {
  const [interests, setInterests] = useState<string[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    getProfile().then(data => {
      if (data && data.length > 0) {
        setInterests(data[0].interests || [])
      }
    })
  }, [])

  const handleAdd = () => {
    const trimmed = input.trim()
    if (trimmed && !interests.includes(trimmed)) {
      const updated = [...interests, trimmed]
      setInterests(updated)
      updateProfile(updated)
    }
    setInput('')
  }

  const handleRemove = (item: string) => {
    const updated = interests.filter(i => i !== item)
    setInterests(updated)
    updateProfile(updated)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Interests</h2>
      <ul>
        {interests.map((item, i) => (
          <li key={i}>
            {item}
            <button onClick={() => handleRemove(item)} style={{ marginLeft: '0.5rem' }}>❌</button>
          </li>
        ))}
      </ul>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Add interest"
      />
      <button onClick={handleAdd}>Add</button>
    </div>
  )
}
