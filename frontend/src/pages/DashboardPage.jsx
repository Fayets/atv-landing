import { useEffect, useMemo, useState } from 'react'
import { fetchLeads as getLeads, updateLead, deleteLead } from '../api/leads'
import styles from './DashboardPage.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const BOTTLENECK_AREA_OPTIONS = ['Marketing', 'Ventas', 'Producto']

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

function parseUtcDate(iso) {
  if (!iso) return new Date(NaN)
  if (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso)
  return new Date(`${iso}Z`)
}

function formatDateShort(iso) {
  const d = parseUtcDate(iso)
  return d.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
  })
}

function formatDateFull(iso) {
  return parseUtcDate(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
    'id', 'name', 'email', 'phone', 'access_code', 'avatar',
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

function objectToSortedEntries(obj) {
  if (!obj) return []
  return Object.entries(obj).sort((a, b) => b[1] - a[1])
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

function CalificadoBadge({ calificado }) {
  if (calificado === true) {
    return <span className={`${styles.statusPill} ${styles.statusCalificado}`}>✓ Calificado</span>
  }
  if (calificado === false) {
    return <span className={`${styles.statusPill} ${styles.statusNoCalificado}`}>✗ No calificado</span>
  }
  return <span className={`${styles.statusPill} ${styles.statusSinCalificar}`}>Sin calificar</span>
}

function isLeadComplete(lead) {
  return lead.avatar != null && lead.avatar !== ''
}

function TipoLeadBadge({ lead }) {
  if (isLeadComplete(lead)) {
    return <span className={`${styles.statusPill} ${styles.statusCompleto}`}>Completo</span>
  }
  return <span className={`${styles.statusPill} ${styles.statusSoloDatos}`}>Solo datos</span>
}

function ResponsableBadge({ responsable }) {
  if (responsable === 'Lucas') {
    return <span className={`${styles.statusPill} ${styles.responsableLucas}`}>Lucas</span>
  }
  if (responsable === 'Jero') {
    return <span className={`${styles.statusPill} ${styles.responsableJero}`}>Jero</span>
  }
  return <span className={`${styles.statusPill} ${styles.responsableSinAsignar}`}>Sin asignar</span>
}

function getRowStyle(calificado) {
  if (calificado === true) {
    return { background: 'rgba(29, 158, 117, 0.08)', borderLeft: '3px solid #1d9e75' }
  }
  if (calificado === false) {
    return { background: 'rgba(176, 69, 69, 0.08)', borderLeft: '3px solid var(--red)' }
  }
  return undefined
}

export default function DashboardPage() {
  const [leads, setLeads] = useState([])
  const [metricsData, setMetricsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [responsableFilter, setResponsableFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [regenConfirming, setRegenConfirming] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

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
      if (responsableFilter && lead.responsable !== responsableFilter) return false
      if (statusFilter === 'pending' && lead.contacted) return false
      if (statusFilter === 'contacted' && !lead.contacted) return false
      if (statusFilter === 'complete' && !isLeadComplete(lead)) return false
      if (statusFilter === 'solo-datos' && isLeadComplete(lead)) return false
      if (!q) return true
      return (
        lead.name.toLowerCase().includes(q)
        || lead.email.toLowerCase().includes(q)
        || lead.phone.toLowerCase().includes(q)
        || (lead.access_code || '').toLowerCase().includes(q)
      )
    })
  }, [leads, search, areaFilter, statusFilter, responsableFilter])

  const metrics = useMemo(() => {
    const total = metricsData?.total ?? 0
    const contacted = metricsData?.contacted ?? 0
    const pending = metricsData?.pending ?? 0
    const rate = total > 0 ? Math.round((contacted / total) * 100) : 0
    const lucasCount = leads.filter((l) => l.responsable === 'Lucas').length
    const jeroCount = leads.filter((l) => l.responsable === 'Jero').length
    return { total, pending, contacted, rate, lucasCount, jeroCount }
  }, [metricsData, leads])

  const dailyData = useMemo(() => (
    (metricsData?.daily ?? []).map((day) => ({
      key: day.date,
      label: formatDateShort(day.date),
      count: day.count,
    }))
  ), [metricsData])

  const maxDaily = useMemo(() => Math.max(...dailyData.map((d) => d.count), 1), [dailyData])
  const avatarData = useMemo(() => objectToSortedEntries(metricsData?.by_avatar), [metricsData])
  const bottleneckAreaData = useMemo(
    () => objectToSortedEntries(metricsData?.by_bottleneck_area),
    [metricsData],
  )
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
    setRegenConfirming(false)
    setRegenLoading(false)
    setRegenError(null)
    setCodeCopied(false)
    setDeleteConfirming(false)
    setDeleteLoading(false)
    setDeleteError(null)
  }

  const closePanel = () => {
    setSelectedId(null)
    setRegenConfirming(false)
    setRegenLoading(false)
    setRegenError(null)
    setCodeCopied(false)
    setDeleteConfirming(false)
    setDeleteLoading(false)
    setDeleteError(null)
  }

  const handleCopyCode = () => {
    if (!selectedLead?.access_code) return
    navigator.clipboard.writeText(selectedLead.access_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleConfirmRegenerar = async () => {
    if (!selectedLead) return
    setRegenLoading(true)
    setRegenError(null)
    try {
      const res = await fetch(`${API_BASE}/leads/${selectedLead.id}/regenerar-codigo`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('No se pudo regenerar la clave')
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setRegenConfirming(false)
    } catch {
      setRegenError('No se pudo regenerar la clave. Intentá de nuevo.')
    } finally {
      setRegenLoading(false)
    }
  }

  const saveNote = async () => {
    if (!selectedLead) return
    try {
      const updated = await updateLead(selectedLead.id, { notes: noteDraft })
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  const handleResponsableChange = async (nuevoValor) => {
    if (!selectedLead) return
    try {
      const updated = await updateLead(selectedLead.id, { responsable: nuevoValor })
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedLead) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteLead(selectedLead.id)
      setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id))
      closePanel()
    } catch {
      setDeleteError('No se pudo eliminar el registrado. Intentá de nuevo.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <nav className={styles.navbar}>
          <div className={styles.navLeft}>
            <img
              src={`${import.meta.env.BASE_URL}ATVLogin.png`}
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
            src={`${import.meta.env.BASE_URL}ATVLogin.png`}
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
              <span className={styles.metricLabel}>Total registrados</span>
              <i className="ti ti-users" />
            </div>
            <div className={styles.metricNum}>{metrics.total}</div>
          </div>
          <div className={`${styles.metricCard} ${styles.metricHighlight}`}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Pendientes de contacto</span>
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
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Asignación setters</span>
              <i className="ti ti-users-group" />
            </div>
            <div className={styles.metricSplit}>
              <span className={styles.metricSplitLucas}>Lucas: {metrics.lucasCount}</span>
              <span className={styles.metricSplitSep}>|</span>
              <span className={styles.metricSplitJero}>Jero: {metrics.jeroCount}</span>
            </div>
          </div>
        </section>

        <section className={styles.chartsGrid}>
          <div className={`${styles.chartCard} ${styles.chartCardDaily}`}>
            <h2 className={styles.chartTitle}>Registros últimos 14 días</h2>
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
            <h2 className={styles.chartTitle}>Por situación</h2>
            <div className={styles.hBarList}>
              {avatarData.length === 0 ? (
                <p className={styles.cellMuted}>Sin datos todavía</p>
              ) : avatarData.map(([label, value]) => (
                <HorizontalBar key={label} label={label} value={value} max={maxAvatar} />
              ))}
            </div>
          </div>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Por cuello de botella</h2>
            <div className={styles.hBarList}>
              {bottleneckAreaData.length === 0 ? (
                <p className={styles.cellMuted}>Sin datos todavía</p>
              ) : bottleneckAreaData.map(([label, value]) => (
                <HorizontalBar key={label} label={label} value={value} max={maxBottleneckArea} />
              ))}
            </div>
          </div>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Top obstáculos</h2>
            <div className={styles.hBarList}>
              {subObstacleData.length === 0 ? (
                <p className={styles.cellMuted}>Sin datos todavía</p>
              ) : subObstacleData.map(([label, value]) => (
                <HorizontalBar key={label} label={label} value={value} max={maxSubObstacle} />
              ))}
            </div>
          </div>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Por facturación</h2>
            <div className={styles.hBarList}>
              {revenueData.length === 0 ? (
                <p className={styles.cellMuted}>Sin datos todavía</p>
              ) : revenueData.map(([label, value]) => (
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
            <select className={styles.select} value={responsableFilter} onChange={(e) => setResponsableFilter(e.target.value)}>
              <option value="">Todos los responsables</option>
              <option value="Lucas">Lucas</option>
              <option value="Jero">Jero</option>
            </select>
            <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="contacted">Contactados</option>
              <option value="complete">Completos</option>
              <option value="solo-datos">Solo datos</option>
            </select>
          </div>
          <div className={styles.toolbarRight}>
            <span className={styles.leadCount}>{filteredLeads.length} registrados</span>
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
                  <th>WhatsApp</th>
                  <th>Clave</th>
                  <th>Responsable</th>
                  <th>Situación</th>
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
                    <td colSpan={11} className={styles.cellMuted}>Sin registrados todavía</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} onClick={() => openPanel(lead)} style={getRowStyle(lead.calificado)}>
                      <td className={styles.cellMuted}>{lead.id}</td>
                      <td className={styles.cellName}>{lead.name}</td>
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
                      <td>
                        <span className={styles.accessCode}>{lead.access_code}</span>
                      </td>
                      <td>
                        <ResponsableBadge responsable={lead.responsable} />
                      </td>
                      <td className={styles.cellMuted}>{lead.avatar || '—'}</td>
                      <td>
                        <div className={styles.areaBadges}>
                          {(lead.bottleneck_areas || []).map((area) => (
                            <span key={area} className={styles.nicheBadge}>{area}</span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.cellMuted}>{lead.revenue || '—'}</td>
                      <td className={styles.cellMuted}>{formatDateShort(lead.created_at)}</td>
                      <td>
                        <div className={styles.statusBadges}>
                          <TipoLeadBadge lead={lead} />
                          <CalificadoBadge calificado={lead.calificado} />
                          <StatusPill contacted={lead.contacted} onClick={() => toggleContacted(lead.id)} />
                        </div>
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
              <h3 className={styles.panelSectionTitle}>Clave de acceso</h3>
              <div className={styles.panelCodeBlock}>
                <div className={styles.panelAccessCode}>{selectedLead.access_code}</div>
                <div className={styles.codeActions}>
                  <button type="button" className={styles.btnCopyCode} onClick={handleCopyCode}>
                    {codeCopied ? '✓ COPIADO' : 'COPIAR'}
                  </button>
                  <button
                    type="button"
                    className={styles.btnRegenCode}
                    onClick={() => setRegenConfirming(true)}
                    disabled={regenLoading || regenConfirming}
                  >
                    ↺ REGENERAR
                  </button>
                </div>
                {regenConfirming && (
                  <div className={styles.regenConfirmBox}>
                    <p className={styles.regenConfirmText}>
                      ¿Confirmar? La clave anterior quedará inválida.
                    </p>
                    <div className={styles.regenConfirmActions}>
                      <button
                        type="button"
                        className={styles.btnRegenConfirm}
                        onClick={handleConfirmRegenerar}
                        disabled={regenLoading}
                      >
                        {regenLoading ? 'GENERANDO...' : 'CONFIRMAR'}
                      </button>
                      <button
                        type="button"
                        className={styles.btnRegenCancel}
                        onClick={() => {
                          setRegenConfirming(false)
                          setRegenError(null)
                        }}
                        disabled={regenLoading}
                      >
                        CANCELAR
                      </button>
                    </div>
                  </div>
                )}
                {regenError && <p className={styles.regenError}>{regenError}</p>}
              </div>
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Respuestas del quiz</h3>
              <div className={styles.quizField}>
                <span className={styles.quizLabel}>Situación</span>
                <div className={styles.quizValue}>{selectedLead.avatar || 'Sin completar'}</div>
              </div>
              <div className={styles.quizField}>
                <span className={styles.quizLabel}>Facturación</span>
                <div className={styles.quizValue}>{selectedLead.revenue || 'Sin completar'}</div>
              </div>
            </section>

            {(selectedLead.bottleneck_areas || []).length > 0 && (
              <section className={styles.panelSection}>
                <h3 className={styles.panelSectionTitle}>Cuello de botella</h3>
                {(selectedLead.bottleneck_areas || []).map((area) => {
                  const field = AREA_FIELD_MAP[area]
                  const subs = field ? (selectedLead[field] || []) : []
                  return (
                    <div key={area} className={styles.bottleneckBlock}>
                      <div className={styles.bottleneckAreaTitle}>{area}</div>
                      <ul className={styles.bottleneckSubList}>
                        {subs.length === 0 ? (
                          <li className={styles.bottleneckSubItem}>Sin detalle</li>
                        ) : subs.map((opt) => (
                          <li key={opt} className={styles.bottleneckSubItem}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </section>
            )}

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Fecha de registro</h3>
              <p className={styles.panelMeta}>{formatDateFull(selectedLead.created_at)}</p>
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Responsable</h3>
              <select
                className={styles.select}
                value={selectedLead.responsable || ''}
                onChange={(e) => handleResponsableChange(e.target.value)}
              >
                <option value="" disabled>Sin asignar</option>
                <option value="Lucas">Lucas</option>
                <option value="Jero">Jero</option>
              </select>
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Estado</h3>
              <div className={styles.statusBadges}>
                <TipoLeadBadge lead={selectedLead} />
                <CalificadoBadge calificado={selectedLead.calificado} />
                <StatusPill
                  contacted={selectedLead.contacted}
                  onClick={() => toggleContacted(selectedLead.id)}
                  fullWidth
                />
              </div>
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Notas internas</h3>
              <textarea
                className={styles.notesArea}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Agregar notas sobre este registrado..."
                rows={4}
              />
              <button type="button" className={styles.btnSaveNote} onClick={saveNote}>
                Guardar nota
              </button>
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Eliminar registrado</h3>
              {!deleteConfirming ? (
                <button
                  type="button"
                  className={styles.btnDeleteLead}
                  onClick={() => setDeleteConfirming(true)}
                  disabled={deleteLoading}
                >
                  <i className="ti ti-trash" />
                  ELIMINAR REGISTRO
                </button>
              ) : (
                <div className={styles.deleteConfirmBox}>
                  <p className={styles.deleteConfirmText}>
                    ¿Eliminar a {selectedLead.name}? Esta acción no se puede deshacer.
                  </p>
                  <div className={styles.deleteConfirmActions}>
                    <button
                      type="button"
                      className={styles.btnDeleteConfirm}
                      onClick={handleConfirmDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'ELIMINANDO...' : 'SÍ, ELIMINAR'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnDeleteCancel}
                      onClick={() => {
                        setDeleteConfirming(false)
                        setDeleteError(null)
                      }}
                      disabled={deleteLoading}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
              {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
            </section>
          </aside>
        </>
      )}
    </div>
  )
}
