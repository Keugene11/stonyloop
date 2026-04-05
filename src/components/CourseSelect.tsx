'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { searchCourses } from '@/lib/sbu-data'

interface CourseSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function CourseSelect({ value, onChange, className }: CourseSelectProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const courses = value ? value.split(', ').filter(Boolean) : []

  useEffect(() => {
    if (input.length >= 2) {
      setResults(searchCourses(input).filter(c => !courses.includes(c)))
    } else {
      setResults([])
    }
  }, [input, courses])

  const addCourse = (course: string) => {
    if (courses.includes(course)) return
    onChange([...courses, course].join(', '))
    setInput('')
    setResults([])
  }

  const removeCourse = (course: string) => {
    onChange(courses.filter(c => c !== course).join(', '))
  }

  return (
    <div className="relative">
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {courses.map((course) => (
            <span key={course} className="inline-flex items-center gap-1 bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">
              {course}
              <button type="button" onClick={() => removeCourse(course)} className="text-text-muted hover:text-text">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Type a course (e.g. CSE 114, MAT 131...)"
        className={className}
      />
      {open && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
            {results.map((course) => (
              <button
                key={course}
                type="button"
                onClick={() => addCourse(course)}
                className="w-full text-left px-4 py-2 text-[13px] hover:bg-bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {course}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
