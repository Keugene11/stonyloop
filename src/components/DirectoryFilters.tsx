'use client'

import { Search, X } from 'lucide-react'
import StyledSelect from '@/components/StyledSelect'
import { SBU_MAJORS } from '@/lib/sbu-data'
import { RESIDENCE_HALLS } from '@/lib/residence-halls'
import { CLASS_YEARS, GENDERS } from '@/lib/constants'

interface Filters {
  name: string
  residence_hall: string
  course: string
  gender: string
  major: string
  class_year: string
}

interface DirectoryFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function DirectoryFilters({ filters, onChange }: DirectoryFiltersProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  const hasFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="space-y-3">
      {/* Name search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input
          type="text"
          value={filters.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Search by name..."
          className="w-full bg-bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
        />
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-0.5 block">Residence Hall</label>
          <StyledSelect
            value={filters.residence_hall}
            onChange={(v) => update('residence_hall', v)}
            placeholder="Any hall"
            searchable
            options={RESIDENCE_HALLS}
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-0.5 block">Major</label>
          <StyledSelect
            value={filters.major}
            onChange={(v) => update('major', v)}
            placeholder="Any major"
            searchable
            options={SBU_MAJORS.map(m => ({ value: m, label: m }))}
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-0.5 block">Gender</label>
          <StyledSelect
            value={filters.gender}
            onChange={(v) => update('gender', v)}
            placeholder="Any"
            options={GENDERS.map(g => ({ value: g, label: g }))}
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-0.5 block">Class Year</label>
          <StyledSelect
            value={filters.class_year}
            onChange={(v) => update('class_year', v)}
            placeholder="Any"
            options={CLASS_YEARS.map(y => ({ value: y.toString(), label: y.toString() }))}
          />
        </div>
      </div>

      {/* Course search */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-0.5 block">Course</label>
        <input
          type="text"
          value={filters.course}
          onChange={(e) => update('course', e.target.value.toUpperCase())}
          placeholder="e.g. CSE 214, ECO 108..."
          className="w-full bg-bg-card border border-border rounded-xl px-3 py-2 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
        />
      </div>

      {hasFilters && (
        <button
          onClick={() => onChange({ name: '', residence_hall: '', course: '', gender: '', major: '', class_year: '' })}
          className="text-[12px] text-text-muted flex items-center gap-1 press hover:text-text"
        >
          <X size={12} /> Clear all filters
        </button>
      )}
    </div>
  )
}
