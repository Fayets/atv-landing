import { useEffect, useMemo, useState } from 'react'
import { fetchLeads as getLeads, updateLead } from '../api/leads'
import styles from './DashboardPage.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

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
    'id', 'name', 'email', 'phone', 'access_code',
    'created_at', 'contacted', 'notes',
  ]
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = leads.map((l) => headers.map((h) => escape(l[h])).join(','))
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

export default function DashboardPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [regenConfirming, setRegenConfirming] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      try {
        const leadsResult = await getLeads()
        if (!cancelled) setLeads(leadsResult)
      } catch {
        if (!cancelled) setLeads([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()
    return () => { cancelled = true }
  }, [])

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leads
    return leads.filter((lead) => (
      lead.name.toLowerCase().includes(q)
      || lead.email.toLowerCase().includes(q)
      || lead.phone.toLowerCase().includes(q)
    ))
  }, [leads, search])

  const metrics = useMemo(() => {
    const total = leads.length
    const contacted = leads.filter((l) => l.contacted).length
    const pending = total - contacted
    const rate = total > 0 ? Math.round((contacted / total) * 100) : 0
    return { total, pending, contacted, rate }
  }, [leads])

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
  }

  const closePanel = () => {
    setSelectedId(null)
    setRegenConfirming(false)
    setRegenLoading(false)
    setRegenError(null)
    setCodeCopied(false)
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
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Clave de acceso</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.cellMuted}>Sin registrados todavía</td>
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
                      <td>
                        <span className={styles.accessCode}>{lead.access_code}</span>
                      </td>
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
              <h3 className={styles.panelSectionTitle}>Clave de acceso</h3>
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
            </section>

            <section className={styles.panelSection}>
              <h3 className={styles.panelSectionTitle}>Fecha de registro</h3>
              <p className={styles.panelMeta}>{formatDateFull(selectedLead.created_at)}</p>
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
                placeholder="Agregar notas sobre este registrado..."
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
