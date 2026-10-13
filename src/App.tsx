import { useState } from 'react'

import './App.css'
import { ApplicationCard } from './components/ApplicationCard'
import type { Application } from './types'
import { ApplicationList } from './components/ApplicationList'
import { seedApplications } from './data/seed'
import { BrowserRouter, Route, Routes } from 'react-router'
import { MainLayout } from './Layout'
import { ApplicationDetails } from './components/ApplicationDetails'


function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route element={<MainLayout />}>
      <Route path="/" element={<h1>Welcome back</h1>} />
          <Route path="/applications" element={<ApplicationList applications={seedApplications}/>} />
          <Route
            path="/applications/:id"
            element={<ApplicationDetails />}
          />

      </Route>
    </Routes>
    
    </BrowserRouter>
    </>
  )
}

export default App
