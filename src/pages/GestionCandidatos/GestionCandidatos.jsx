// src/pages/GestionCandidatos/GestionCandidatos.jsx
import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { candidatosService } from '../../services'
import CrudPage from '../../components/ui/CrudPage'
import { Input, Select, Modal, Button, Alert } from '../../components/ui'

const COLS = [
  { key: 'id',             label: 'ID',   width: 60 },
  { key: 'nombre_completo',label: 'Nombre Completo' },
  { key: 'tipo_documento_descripcion', label: 'Tipo Doc.', width: 90 },
  { key: 'numero_documento',label: 'Documento', width: 120 },
  { key: 'email',          label: 'Email' },
  { key: 'telefono',       label: 'Teléfono', width: 120 },
]

function Form({ form, setForm }) {
  const tipos = useFetch(() => candidatosService.getTiposDocumento())
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Primer Nombre *"   value={form.primer_nombre||''} onChange={e => set('primer_nombre', e.target.value)} />
        <Input label="Segundo Nombre"    value={form.segundo_nombre||''} onChange={e => set('segundo_nombre', e.target.value)} />
        <Input label="Primer Apellido *" value={form.primer_apellido||''} onChange={e => set('primer_apellido', e.target.value)} />
        <Input label="Segundo Apellido"  value={form.segundo_apellido||''} onChange={e => set('segundo_apellido', e.target.value)} />
      </div>
      <Select label="Tipo Documento" value={form.tipo_documento||''} onChange={e => set('tipo_documento', e.target.value||null)}>
        <option value="">Sin especificar</option>
        {tipos.data?.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
      </Select>
      <Input label="Número Documento" value={form.numero_documento||''} onChange={e => set('numero_documento', e.target.value)} />
      <Input label="Email"  type="email" value={form.email||''} onChange={e => set('email', e.target.value)} />
      <Input label="Teléfono"          value={form.telefono||''} onChange={e => set('telefono', e.target.value)} />
    </>
  )
}

export default function GestionCandidatos() {
  const { user } = useAuth()
  const cid  = user?.compania
  const fetch = useFetch(() => candidatosService.vCandidatos(cid), [cid])

  const DEFAULT = { primer_nombre:'', segundo_nombre:'', primer_apellido:'', segundo_apellido:'',
    tipo_documento:null, numero_documento:'', email:'', telefono:'' }

  const handleSave = async (data, id) => {
    if (id) {
      // Actualizar datos_candidato existentes
      await candidatosService.updateDatos(cid, id, data)
    } else {
      // 1. Crear candidato
      const all = await candidatosService.getCandidatos(cid)
      const id_interno = (all.data.length || 0) + 1
      const cand = await candidatosService.createCandidato(cid, { id_interno })
      // 2. Crear datos_candidato
      await candidatosService.createDatos(cid, cand.data.id, { ...data, compania: cid, candidato: cand.data.id })
    }
  }

  return (
    <CrudPage
      title="Candidatos"
      subtitle="Base de datos de candidatos registrados"
      columns={COLS}
      fetchData={fetch}
      defaultForm={DEFAULT}
      searchFields={['nombre_completo','numero_documento','email']}
      FormContent={Form}
      onSave={handleSave}
      onDelete={async row => await candidatosService.deleteCandidato(cid, row.id)}
    />
  )
}
