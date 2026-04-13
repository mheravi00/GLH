import { useMemo, useState } from 'react'
import { AuthContext } from './auth-context'

function decodeToken(token) {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { userId: payload.userId, role: payload.role, name: payload.name }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('glh_token')
    if (storedToken && !decodeToken(storedToken)) {
      localStorage.removeItem('glh_token')
      return null
    }
    return storedToken
  })
  const [nameOverride, setNameOverride] = useState(null)

  const user = useMemo(() => {
    const decoded = decodeToken(token)
    if (!decoded) return null
    return { ...decoded, name: nameOverride || decoded.name }
  }, [token, nameOverride])

  function login(tokenStr, name) {
    localStorage.setItem('glh_token', tokenStr)
    setToken(tokenStr)
    setNameOverride(name || null)
  }

  function logout() {
    localStorage.removeItem('glh_token')
    setToken(null)
    setNameOverride(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
