const AREA_FIELD_MAP = {
  Marketing: 'bottleneck_marketing',
  Ventas: 'bottleneck_ventas',
  Producto: 'bottleneck_producto',
  Sistemas: 'bottleneck_sistemas',
}

const STATUS_LABELS = {
  all: 'Todos',
  pending: 'Pendientes',
  contacted: 'Contactados',
  complete: 'Completos',
  'solo-datos': 'Solo datos',
  calificado: 'Calificados',
  'no-calificado': 'No calificados',
}

function parseUtcDate(iso) {
  if (!iso) return new Date(NaN)
  if (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso)
  return new Date(`${iso}Z`)
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

function exportStamp() {
  return new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fileDateSuffix() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
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

function isLeadComplete(lead) {
  return lead.avatar != null && lead.avatar !== ''
}

function formatCalificado(calificado) {
  if (calificado === true) return 'Calificado'
  if (calificado === false) return 'No calificado'
  return 'Sin calificar'
}

function formatTipoLead(lead) {
  return isLeadComplete(lead) ? 'Completo' : 'Solo datos'
}

function formatList(values) {
  if (!values || values.length === 0) return '—'
  return values.join(', ')
}

function formatBottleneckText(lead) {
  const areas = lead.bottleneck_areas || []
  if (areas.length === 0) return 'Sin completar'

  return areas.map((area) => {
    const field = AREA_FIELD_MAP[area]
    const subs = field ? (lead[field] || []) : []
    const detail = subs.length > 0 ? subs.join('; ') : 'Sin detalle'
    return `${area}: ${detail}`
  }).join('\n  ')
}

function describeActiveFilters(filters = {}) {
  const parts = []

  if (filters.search?.trim()) parts.push(`Búsqueda: "${filters.search.trim()}"`)
  if (filters.areaFilter) parts.push(`Área: ${filters.areaFilter}`)
  if (filters.responsableFilter) parts.push(`Responsable: ${filters.responsableFilter}`)
  if (filters.avatarFilter) parts.push(`Avatar: ${filters.avatarFilter}`)
  if (filters.revenueFilter) parts.push(`Facturación: ${filters.revenueFilter}`)
  if (filters.dateFilter) parts.push(`Día: ${filters.dateFilter}`)
  if (filters.statusFilter && filters.statusFilter !== 'all') {
    parts.push(`Estado: ${STATUS_LABELS[filters.statusFilter] || filters.statusFilter}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Sin filtros activos'
}

function computeSummary(leads) {
  return {
    total: leads.length,
    calificados: leads.filter((l) => l.calificado === true).length,
    noCalificados: leads.filter((l) => l.calificado === false).length,
    sinCalificar: leads.filter((l) => l.calificado == null).length,
    completos: leads.filter(isLeadComplete).length,
    soloDatos: leads.filter((l) => !isLeadComplete(l)).length,
    contactados: leads.filter((l) => l.contacted).length,
    pendientes: leads.filter((l) => !l.contacted).length,
    lucas: leads.filter((l) => l.responsable === 'Lucas').length,
    jero: leads.filter((l) => l.responsable === 'Jero').length,
    totalAccesos: leads.reduce((sum, l) => sum + (l.access_count ?? 0), 0),
  }
}

function buildReportMeta(leads, filters) {
  return {
    generatedAt: exportStamp(),
    filtersText: describeActiveFilters(filters),
    summary: computeSummary(leads),
  }
}

function buildLeadBlockText(lead) {
  const lines = [
    `${'═'.repeat(52)}`,
    `REGISTRO #${lead.id} — ${lead.name}`,
    `${'═'.repeat(52)}`,
    '',
    `Fecha de registro: ${formatDateFull(lead.created_at)}`,
    `Estado: ${lead.contacted ? 'Contactado' : 'Pendiente'} · ${formatTipoLead(lead)} · ${formatCalificado(lead.calificado)}`,
    `Responsable: ${lead.responsable || 'Sin asignar'}`,
    '',
    'Contacto',
    `  Email: ${lead.email}`,
    `  WhatsApp: ${lead.phone}`,
    `  Instagram: ${lead.ig ? (lead.ig.startsWith('@') ? lead.ig : `@${lead.ig}`) : '—'}`,
    '',
    'Acceso',
    `  Clave: ${lead.access_code}`,
    `  Accesos con clave: ${lead.access_count ?? 0}`,
    '',
    'Quiz',
    `  Avatar: ${lead.avatar || 'Sin completar'}`,
    `  Facturación: ${lead.revenue || 'Sin completar'}`,
    '',
    'Cuello de botella',
    `  ${formatBottleneckText(lead).replace(/\n/g, '\n  ')}`,
    '',
    'Notas internas',
    `  ${(lead.notes || '').trim() || '—'}`,
    '',
  ]
  return lines.join('\n')
}

export function buildLeadsReportText(leads, filters = {}) {
  const meta = buildReportMeta(leads, filters)
  const { summary } = meta

  const header = [
    'ATV — REPORTE DE REGISTRADOS',
    `Generado: ${meta.generatedAt}`,
    `Registros incluidos: ${summary.total}`,
    `Filtros: ${meta.filtersText}`,
    '',
    '── RESUMEN ──',
    `Total: ${summary.total}`,
    `Calificados: ${summary.calificados} · No calificados: ${summary.noCalificados} · Sin calificar: ${summary.sinCalificar}`,
    `Completos: ${summary.completos} · Solo datos: ${summary.soloDatos}`,
    `Contactados: ${summary.contactados} · Pendientes: ${summary.pendientes}`,
    `Lucas: ${summary.lucas} · Jero: ${summary.jero}`,
    `Accesos totales con clave: ${summary.totalAccesos}`,
    '',
  ].join('\n')

  if (leads.length === 0) {
    return `${header}\nNo hay registrados que coincidan con la selección actual.\n`
  }

  return `${header}${leads.map(buildLeadBlockText).join('\n')}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function leadAccentClass(calificado) {
  if (calificado === true) return 'lead-card--calificado'
  if (calificado === false) return 'lead-card--no-calificado'
  return ''
}

function buildLeadCardHtml(lead) {
  const igDisplay = lead.ig
    ? (lead.ig.startsWith('@') ? lead.ig : `@${lead.ig}`)
    : '—'

  const bottleneckHtml = (lead.bottleneck_areas || []).length === 0
    ? '<p class="muted">Sin completar</p>'
    : (lead.bottleneck_areas || []).map((area) => {
      const field = AREA_FIELD_MAP[area]
      const subs = field ? (lead[field] || []) : []
      const items = subs.length > 0
        ? `<ul>${subs.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
        : '<p class="muted">Sin detalle</p>'
      return `<div class="bottleneck"><strong>${escapeHtml(area)}</strong>${items}</div>`
    }).join('')

  return `
    <article class="lead-card ${leadAccentClass(lead.calificado)}">
      <header class="lead-head">
        <span class="lead-id">#${lead.id}</span>
        <h2>${escapeHtml(lead.name)}</h2>
        <p class="lead-meta">${escapeHtml(formatDateFull(lead.created_at))}</p>
      </header>
      <div class="badges">
        <span class="badge">${escapeHtml(formatCalificado(lead.calificado))}</span>
        <span class="badge">${escapeHtml(formatTipoLead(lead))}</span>
        <span class="badge">${lead.contacted ? 'Contactado' : 'Pendiente'}</span>
        <span class="badge">${escapeHtml(lead.responsable || 'Sin asignar')}</span>
      </div>
      <div class="grid">
        <section>
          <h3>Contacto</h3>
          <p><span>Email</span>${escapeHtml(lead.email)}</p>
          <p><span>WhatsApp</span>${escapeHtml(lead.phone)}</p>
          <p><span>Instagram</span>${escapeHtml(igDisplay)}</p>
        </section>
        <section>
          <h3>Acceso</h3>
          <p class="code">${escapeHtml(lead.access_code)}</p>
          <p><span>Accesos</span>${lead.access_count ?? 0}</p>
        </section>
        <section>
          <h3>Quiz</h3>
          <p><span>Avatar</span>${escapeHtml(lead.avatar || 'Sin completar')}</p>
          <p><span>Facturación</span>${escapeHtml(lead.revenue || 'Sin completar')}</p>
        </section>
        <section class="full">
          <h3>Cuello de botella</h3>
          ${bottleneckHtml}
        </section>
        <section class="full">
          <h3>Notas internas</h3>
          <p class="notes">${escapeHtml((lead.notes || '').trim() || '—')}</p>
        </section>
      </div>
    </article>
  `
}

export function buildLeadsReportHtml(leads, filters = {}) {
  const meta = buildReportMeta(leads, filters)
  const { summary } = meta

  const leadsHtml = leads.length === 0
    ? '<p class="empty">No hay registrados que coincidan con la selección actual.</p>'
    : leads.map(buildLeadCardHtml).join('')

  return `
    <div class="atv-report">
      <style>
        .atv-report {
          width: 794px;
          box-sizing: border-box;
          padding: 36px 32px 48px;
          font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          color: #fff;
          background: #0a0505;
          background-image: radial-gradient(ellipse 95% 75% at 50% 0%, rgba(52, 22, 22, 0.88) 0%, #050505 100%);
        }
        .atv-report * { box-sizing: border-box; }
        .report-brand {
          margin: 0 0 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .report-title {
          margin: 0 0 8px;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .report-sub {
          margin: 0 0 24px;
          font-size: 13px;
          color: #a1a1a1;
          line-height: 1.5;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 28px;
        }
        .summary-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .summary-card strong {
          display: block;
          font-size: 22px;
          margin-bottom: 4px;
        }
        .summary-card span {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .lead-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 16px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .lead-card--calificado { border-left: 4px solid #34d399; }
        .lead-card--no-calificado { border-left: 4px solid #e63946; }
        .lead-head { margin-bottom: 12px; }
        .lead-id {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .lead-head h2 {
          margin: 4px 0 2px;
          font-size: 18px;
          font-weight: 600;
        }
        .lead-meta {
          margin: 0;
          font-size: 12px;
          color: #a1a1a1;
        }
        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }
        .badge {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .grid section {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 12px;
        }
        .grid section.full { grid-column: 1 / -1; }
        .grid h3 {
          margin: 0 0 8px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .grid p {
          margin: 0 0 6px;
          font-size: 13px;
          line-height: 1.45;
        }
        .grid p span {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.4);
          margin-bottom: 2px;
        }
        .grid p.code {
          font-family: ui-monospace, Menlo, Consolas, monospace;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .grid .notes { white-space: pre-wrap; }
        .bottleneck { margin-bottom: 8px; }
        .bottleneck ul {
          margin: 6px 0 0;
          padding-left: 16px;
          font-size: 12px;
          color: #d4d4d4;
        }
        .muted { margin: 0; font-size: 12px; color: #a1a1a1; }
        .empty {
          padding: 24px;
          text-align: center;
          color: #a1a1a1;
          border: 1px dashed rgba(255,255,255,0.12);
          border-radius: 12px;
        }
      </style>
      <p class="report-brand">Aumenta Tu Valor</p>
      <h1 class="report-title">Reporte de registrados</h1>
      <p class="report-sub">
        Generado: ${escapeHtml(meta.generatedAt)}<br />
        Registros incluidos: ${summary.total}<br />
        Filtros: ${escapeHtml(meta.filtersText)}
      </p>
      <div class="summary">
        <div class="summary-card"><strong>${summary.total}</strong><span>Total</span></div>
        <div class="summary-card"><strong>${summary.calificados}</strong><span>Calificados</span></div>
        <div class="summary-card"><strong>${summary.noCalificados}</strong><span>No calificados</span></div>
        <div class="summary-card"><strong>${summary.completos}</strong><span>Completos</span></div>
        <div class="summary-card"><strong>${summary.contactados}</strong><span>Contactados</span></div>
        <div class="summary-card"><strong>${summary.totalAccesos}</strong><span>Accesos con clave</span></div>
      </div>
      ${leadsHtml}
    </div>
  `
}

export function downloadLeadsTxt(leads, filters = {}) {
  const content = buildLeadsReportText(leads, filters)
  downloadFile(`atv-registrados-${fileDateSuffix()}.txt`, content, 'text/plain;charset=utf-8')
}

export async function downloadLeadsPdf(leads, filters = {}) {
  const html2pdf = (await import('html2pdf.js')).default

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.innerHTML = buildLeadsReportHtml(leads, filters)
  document.body.appendChild(container)

  const target = container.firstElementChild

  try {
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `atv-registrados-${fileDateSuffix()}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0a0505',
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(target)
      .save()
  } finally {
    document.body.removeChild(container)
  }
}
