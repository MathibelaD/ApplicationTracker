import { useState } from 'react'

import './App.css'
import { ApplicationCard } from './components/ApplicationCard'
import type { Application } from './types'

const data: Application = {
  id: crypto.randomUUID(),
  company: "Microsoft",
  role: "Software Engineer",
  dateSent: "2026-09-20",
  stage: "interview",
  createdAt: new Date().toISOString(),
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
   <h1>Application tracker system</h1>
   <ApplicationCard application={data} />
    </>
  )
}

export default App
