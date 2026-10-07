import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [time, setTime] = useState(1500)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState('focus')

  const [name, setName] = useState('')
  const [members, setMembers] = useState([])

  useEffect(() => {
    const loadTimer = async () => {
      const { data } = await supabase
        .from('pomodoro')
        .select('*')
        .limit(1)
        .single()

      if (data) {
        setTime(data.time_left)
        setIsRunning(data.is_running)
        setMode(data.mode)
      }
    }

    loadTimer()
  }, [])

  useEffect(() => {
    const loadMembers = async () => {
      const { data } = await supabase
        .from('team_members')
        .select('*')

      if (data) setMembers(data)
    }

    loadMembers()
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning])

  useEffect(() => {
    const channel = supabase
      .channel('pomodoro-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pomodoro'
        },
        (payload) => {
          setTime(payload.new.time_left)
          setIsRunning(payload.new.is_running)
          setMode(payload.new.mode)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const toggleTimer = async () => {
    const newRunningState = !isRunning

    await supabase
      .from('pomodoro')
      .update({
        time_left: time,
        is_running: newRunningState
      })
      .eq('id', 1)

    setIsRunning(newRunningState)
  }

  const resetTimer = async () => {
    const newTime = mode === 'focus' ? 1500 : 300

    await supabase
      .from('pomodoro')
      .update({
        time_left: newTime,
        is_running: false
      })
      .eq('id', 1)

    setTime(newTime)
    setIsRunning(false)
  }

  const changeMode = async (newMode) => {
    const newTime = newMode === 'focus' ? 1500 : 300

    await supabase
      .from('pomodoro')
      .update({
        time_left: newTime,
        is_running: false,
        mode: newMode
      })
      .eq('id', 1)

    setTime(newTime)
    setIsRunning(false)
    setMode(newMode)
  }

  const joinTeam = async (e) => {
    e.preventDefault()

    if (!name.trim()) return

    const { data, error } = await supabase
      .from('team_members')
      .insert([{ name }])
      .select()

    if (error) {
      console.error(error)
      return
    }

    setMembers([...members, data[0]])
    setName('')
  }

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="container">
      <h1>Team Pomodoro</h1>

      <h2>{mode === 'focus' ? 'Focus' : 'Break'}</h2>

      <div className="timer">
        {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </div>

      <button onClick={toggleTimer}>
        {isRunning ? 'Pause' : 'Start'}
      </button>

      <button onClick={resetTimer}>Reset</button>

      <br /><br />

      <button onClick={() => changeMode('focus')}>
        Focus — 25 min
      </button>

      <button onClick={() => changeMode('break')}>
        Break — 5 min
      </button>

      <hr />

      <h2>Join Team</h2>

      <form onSubmit={joinTeam}>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button type="submit">Join</button>
      </form>

      <h2>Team Members</h2>

      {members.map((member) => (
        <p key={member.id}>👤 {member.name}</p>
      ))}
    </div>
  )
}

export default App