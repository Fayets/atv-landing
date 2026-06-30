import { useEffect, useMemo, useState } from 'react'
import { fetchLeads as getLeads, updateLead } from '../api/leads'
import styles from './DashboardPage.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const BOTTLENECK_AREA_OPTIONS = ['Marketing', 'Ventas', 'Producto', 'Sistemas']

const AREA_FIELD_MAP = {
  Marketing: 'bottleneck_marketing',
  Ventas: 'bottleneck_ventas',
  Producto: 'bottleneck_producto',
  Sistemas: 'bottleneck_sistemas',
}

async function getMetrics() {
  const res = await fetch(`${API_BASE}/leads/metrics`)
  if (!res.ok) throw new Error('No se pudieron cargar las métricas')
  return res.json()
}

function phoneToWa(phone) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

function formatDateShort(iso) {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

function formatDateFull(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function objectToSortedEntries(obj) {
  if (!obj) return []
  return Object.entries(obj).sort((a, b) => b[1] - a[1])
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportEmails(leads) {
  const emails = leads.map((l) => l.email).join('\n')
  downloadFile('atv-leads-emails.txt', emails, 'text/plain;charset=utf-8')
}

function exportCsv(leads) {
  const headers = [
    'id', 'name', 'email', 'phone', 'avatar',
    'bottleneck_areas', 'bottleneck_marketing', 'bottleneck_ventas',
    'bottleneck_producto', 'bottleneck_sistemas', 'revenue',
    'created_at', 'contacted', 'notes',
  ]
  const formatField = (lead, key) => {
    const value = lead[key]
    if (Array.isArray(value)) return value.join(' | ')
    return value
  }
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = leads.map((l) => headers.map((h) => escape(formatField(l, h))).join(','))
  downloadFile('atv-leads.csv', [headers.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8')
}

function StatusPill({ contacted, onClick, fullWidth = false }) {
  return (
    <button
      type="button"
      className={`${styles.statusPill} ${contacted ? styles.statusContacted : styles.statusPending} ${fullWidth ? styles.statusFull : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <i className={`ti ${contacted ? 'ti-check' : 'ti-clock'}`} />
      {contacted ? 'Contactado' : 'Pendiente'}
    </button>
  )
}

function HorizontalBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className={styles.hBarRow}>
      <span className={styles.hBarLabel} title={label}>{label}</span>
      <div className={styles.hBarTrack}>
        <div className={styles.hBarFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.hBarValue}>{value}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [leads, setLeads] = useState([])
  const [metricsData, setMetricsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      try {
        const [leadsResult, metricsResult] = await Promise.all([
          getLeads(),
          getMetrics(),
        ])
        if (!cancelled) {
          setLeads(leadsResult)
          setMetricsData(metricsResult)
        }
      } catch {
        if (!cancelled) {
          setLeads([])
          setMetricsData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()
    return () => { cancelled = true }
  }, [])

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((lead) => {
      if (areaFilter && !(lead.bottleneck_areas || []).includes(areaFilter)) return false
      if (statusFilter === 'pending' && lead.contacted) return false
      if (statusFilter === 'contacted' && !lead.contacted) return false
      if (!q) return true
      return (
        lead.name.toLowerCase().includes(q)
        || lead.email.toLowerCase().includes(q)
        || lead.phone.toLowerCase().includes(q)
      )
    })
  }, [leads, search, areaFilter, statusFilter])

  const metrics = useMemo(() => {
    const total = metricsData?.total ?? 0
    const contacted = metricsData?.contacted ?? 0
    const pending = metricsData?.pending ?? 0
    const rate = total > 0 ? Math.round((contacted / total) * 100) : 0
    return { total, pending, contacted, rate }
  }, [metricsData])

  const dailyData = useMemo(() => (
    (metricsData?.daily ?? []).map((day) => ({
      key: day.date,
      label: formatDateShort(day.date),
      count: day.count,
    }))
  ), [metricsData])

  const maxDaily = useMemo(() => Math.max(...dailyData.map((d) => d.count), 1), [dailyData])
  const avatarData = useMemo(() => objectToSortedEntries(metricsData?.by_avatar), [metricsData])
  const bottleneckAreaData = useMemo(() => objectToSortedEntries(metricsData?.by_bottleneck_area), [metricsData])
  const subObstacleData = useMemo(
    () => objectToSortedEntries(metricsData?.by_sub_obstacle).slice(0, 8),
    [metricsData],
  )
  const revenueData = useMemo(() => objectToSortedEntries(metricsData?.by_revenue), [metricsData])
  const maxAvatar = avatarData[0]?.[1] ?? 1
  const maxBottleneckArea = bottleneckAreaData[0]?.[1] ?? 1
  const maxSubObstacle = subObstacleData[0]?.[1] ?? 1
  const maxRevenue = revenueData[0]?.[1] ?? 1

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null

  const toggleContacted = async (id) => {
    const lead = leads.find((l) => l.id === id)
    if (!lead) return
    try {
      const updated = await updateLead(id, { contacted: !lead.contacted })
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  const openPanel = (lead) => {
    setSelectedId(lead.id)
    setNoteDraft(lead.notes || '')
  }

  const closePanel = () => setSelectedId(null)

  const saveNote = async () => {
    if (!selectedLead) return
    try {
      const updated = await updateLead(selectedLead.id, { notes: noteDraft })
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <nav className={styles.navbar}>
          <div className={styles.navLeft}>
            <img
              src="/ATVLogin.png"
              alt="ATV — Aumenta Tu Valor"
              className={styles.logo}
              width={32}
              height={32}
            />
          </div>
        </nav>
        <main className={styles.content}>
          <p className={styles.cellMuted}>Cargando...</p>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <img
            src="/ATVLogin.png"
            alt="ATV — Aumenta Tu Valor"
            className={styles.logo}
            width={32}
            height={32}
          />
        </div>
      </nav>

      <main className={styles.content}>
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Leads totales</span>
              <i className="ti ti-users" />
            </div>
            <div className={styles.metricNum}>{metrics.total}</div>
          </div>
          <div className={`${styles.metricCard} ${styles.metricHighlight}`}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Pendientes</span>
              <i className="ti ti-clock" />
            </div>
            <div className={`${styles.metricNum} ${styles.metricNumRed}`}>{metrics.pending}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Contactados</span>
              <i className="ti ti-check" />
            </div>
            <div className={styles.metricNum}>{metrics.contacted}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Tasa de contacto</span>
              <i className="ti ti-chart-pie" />
            </div>
            <div className={styles.metricNum}>{metrics.rate}%</div>
          </div>
        </section>

        <section className={styles.chartsGrid}>
          <div className={`${styles.chartCard} ${styles.chartCardDaily}`}>
            <h2 className={styles.chartTitle}>Leads últimos 14 días</h2>
            <div className={styles.barChart}>
              {dailyData.map((day) => (
                <div key={day.key} className={styles.barCol}>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        height: day.count > 0
                          ? `${Math.max((day.count / maxDaily) * 100, 2)}%`
                          : '0',
                        minHeight: day.count > 0 ? 2 : 0,
                      }}
                    />
                  </div>
                  <span className={styles.barLabel}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Por avatar</h2>
            <div className={styles.hBarList}>
              {avatarData.map(([label, value]) => (
                <HorizontalBar key={label} label={label} value={value} max={maxAvatar} />
              ))}
            </div>
          </div>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Por área de cuello de botella</h2>
            <div className={styles.hBarList}>
              {bottleneckAreaData.map(([label, value]) => (
                <HorizontalBar key={label} label={label} value={value} max={maxBottleneckArea} />
              ))}
            </div>
          </div>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Top sub-obstáculos</h2>
            <div className={styles.hBarList}>
              {subObstacleData.map(([label, value]) => (
                <HorizontalBar key={label} label={label} value={value} max={maxSubObstacle} />
              ))}
            </div>
          </div>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Por facturación</h2>
            <div className={styles.hBarList}>
              {revenueData.map(([label, value]) => (
                <HorizontalBar key={label} label={label} value={value} max={maxRevenue} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <label className={styles.searchWrap}>
              <i className="ti ti-search" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Buscar por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select className={styles.select} value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
              <option value="">Todas las áreas</option>
              {BOTTLENECK_AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="contacted">Contactados</option>
            </select>
          </div>
          <div className={styles.toolbarRight}>
            <span className={styles.leadCount}>{filteredLeads.length} leads</span>
            <button type="button" className={styles.btnExportEmails} onClick={() => exportEmails(filteredLeads)}>
              <i className="ti ti-mail" />
              Exportar emails
            </button>
            <button type="button" className={styles.btnExportCsv} onClick={() => exportCsv(filteredLeads)}>
              <i className="ti ti-download" />
              CSV completo
            </button>
          </div>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Avatar</th>
                  <th>Áreas</th>
                  <th>Facturación</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={styles.cellMuted}>Sin leads todavía</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} onClick={() => openPanel(lead)}>
                      <td className={styles.cellMuted}>{lead.id}</td>
                      <td className={styles.cellName}>{lead.name}</td>
                      <td className={styles.cellMuted}>{lead.email}</td>
                      <td>
                        <a
                          href={phoneToWa(lead.phone)}
                          rel="noopener noreferrer"
                          className={styles.waLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="ti ti-brand-whatsapp" />
                          {lead.phone}
                        </a>
                      </td>
                      <td className={styles.cellMuted}>{lead.avatar}</td>
                      <td>
                        <div className={styles.areaBadges}>
                          {(lead.bottleneck_areas || []).map((area) => (
                            <span key={area} className={styles.nicheBadge}>{area}</span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.cellMuted}>{lead.revenue}</td>
                      <td className={styles.cellMuted}>{formatDateShort(lead.created_at)}</td>
                      <td>
                        <StatusPill contacted={lead.contacted} onClick={() => toggleContacted(lead.id)} />
                      </td>
                      <td>
                        <button type="button" className={styles.rowAction} onClick={(e) => { e.stopPropagation(); openPanel(lead) }}>
                          <i className="ti ti-chevron-right" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedLead && (
        <>
          <button type="button" className={styles.overlay} aria-label="Cerrar panel" onClick={closePanel} />
          <aside className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelName}>{selectedLead.name}</h2>
                <p className={styles.panelDate}>{formatDateFull(selectedLead.created_at)}</p>
              </div>
              <button type="button" className={styles.panelClose} onClick={closePanel}>
                <i className="ti ti-x" />
              </button>
            </header>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Contacto</h3>
              <a href={`mailto:${selectedLead.email}`} className={styles.panelLink}>
                <i className="ti ti-mail" />
                {selectedLead.email}
              </a>
              <a href={phoneToWa(selectedLead.phone)} target="_blank" rel="noopener noreferrer" className={styles.panelWa}>
                <i className="ti ti-brand-whatsapp" />
                {selectedLead.phone}
              </a>
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Respuestas del quiz</h3>
              <div className={styles.quizField}>
                <span className={styles.quizLabel}>Avatar</span>
                <div className={styles.quizValue}>{selectedLead.avatar}</div>
              </div>
              <div className={styles.quizField}>
                <span className={styles.quizLabel}>Facturación</span>
                <div className={styles.quizValue}>{selectedLead.revenue}</div>
              </div>
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Cuello de botella — detalle</h3>
              {(selectedLead.bottleneck_areas || []).map((area) => {
                const field = AREA_FIELD_MAP[area]
                const subs = selectedLead[field] || []
                return (
                  <div key={area} className={styles.bottleneckBlock}>
                    <div className={styles.bottleneckAreaTitle}>{area}</div>
                    <ul className={styles.bottleneckSubList}>
                      {subs.map((opt) => (
                        <li key={opt} className={styles.bottleneckSubItem}>{opt}</li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Estado</h3>
              <StatusPill
                contacted={selectedLead.contacted}
                onClick={() => toggleContacted(selectedLead.id)}
                fullWidth
              />
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Notas internas</h3>
              <textarea
                className={styles.notesArea}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Agregar notas sobre este lead..."
                rows={4}
              />
              <button type="button" className={styles.btnSaveNote} onClick={saveNote}>
                Guardar nota
              </button>
            </section>
          </aside>
        </>
      )}
    </div>
  )
}
