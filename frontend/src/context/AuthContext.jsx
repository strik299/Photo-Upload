import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// In production (Render), API is served from same origin
// In development (Vite), we need to point to localhost:8000
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:8000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchUser(token)
      
      // Setup auto-refresh every 5 minutes
      const refreshInterval = setInterval(() => {
        refreshToken(token)
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearInterval(refreshInterval)
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async (currentToken) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        // We don't use setToken here to avoid triggering the useEffect again
        // just update the localStorage for the next reload
        // But wait, if we don't update state, authFetch will use old token?
        // Yes, we need to update state but avoid infinite loop.
        // Actually, updating token state WILL trigger useEffect, which is fine, 
        // it will just set up a new interval and fetch user again.
        // To be cleaner, we can separate the interval logic.
        // For now, let's just update the state, it resets the timer which is acceptable.
        setToken(data.access_token)
        console.log('Token refreshed automatically')
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      // Don't logout immediately on refresh fail, maybe just network error
    }
  }

  const login = async (username, password) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${API_URL}/api/auth/token`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Credenciales incorrectas')
    }

    const data = await response.json()
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    return true
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // Helper for authenticated requests
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
    const response = await fetch(url, { ...options, headers })
    if (response.status === 401) {
      logout()
    }
    return response
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, token, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
