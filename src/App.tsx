import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Company = {
  id: number
  name: string
  location: string
  industry: string
  website?: string
}

function App() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('All')
  const [industry, setIndustry] = useState('All')
  const [view, setView] = useState<'table' | 'card'>('table')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/companies.json')
        if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
        const data: Company[] = await res.json()
        if (!cancelled) setCompanies(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const locations = useMemo(() => {
    const set = new Set(companies.map((c) => c.location))
    return ['All', ...Array.from(set).sort()]
  }, [companies])

  const industries = useMemo(() => {
    const set = new Set(companies.map((c) => c.industry))
    return ['All', ...Array.from(set).sort()]
  }, [companies])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return companies.filter((c) => {
      const matchesName = q ? c.name.toLowerCase().includes(q) : true
      const matchesLocation = location === 'All' ? true : c.location === location
      const matchesIndustry = industry === 'All' ? true : c.industry === industry
      return matchesName && matchesLocation && matchesIndustry
    })
  }, [companies, search, location, industry])

  return (
    <div className="container">
      <header className="header">
        <h1>Companies Directory</h1>
        <p className="subtitle">Filter and explore company data</p>
      </header>

      <section className="controls">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          aria-label="Search by company name"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Filter by location"
        >
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          aria-label="Filter by industry"
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as 'table' | 'card')}
          aria-label="Select view layout"
        >
          <option value="table">Table</option>
          <option value="card">Card</option>
        </select>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? 'Light' : 'Dark'} Theme
        </button>
        <div className="count" aria-live="polite">
          {filtered.length} of {companies.length} companies
        </div>
      </section>

      {loading && (
        <div className="status">
          <div className="spinner" />
          <span>Loading companies...</span>
        </div>
      )}

      {error && (
        <div className="status error">
          <span>Failed to load: {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && view === 'table' && (
        <>
          <table className="companies-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Industry</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noreferrer">
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                  </td>
                  <td>{c.location}</td>
                  <td>{c.industry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {!loading && !error && view === 'card' && (
        <div className="cards">
          {filtered.map((c) => (
            <div className="card" key={c.id}>
              <h3 className="card-title">
                {c.website ? (
                  <a href={c.website} target="_blank" rel="noreferrer">
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
              </h3>
              <div className="card-meta">
                <span className="badge">{c.location}</span>
                <span className="badge">{c.industry}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
