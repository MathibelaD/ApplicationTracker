import { useState } from 'react'

import './App.css'
import { ApplicationCard } from './components/ApplicationCard'
import type { Application } from './types'
import { ApplicationList } from './components/ApplicationList'
import { seedApplications } from './data/seed'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
   <h1>Application tracker system</h1>
   <ApplicationList applications={seedApplications} />
    </>
  )
}

export default App
