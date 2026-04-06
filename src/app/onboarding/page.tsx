'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, ArrowLeft, Camera, Check } from 'lucide-react'
import { SBU_MAJORS } from '@/lib/sbu-data'
import { CLASS_YEARS } from '@/lib/constants'

const STEPS = ['name', 'major', 'class_year', 'avatar'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [step, setStep] = useState(0)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [fullName, setFullName] = useState('')
  const [major, setMajor] = useState('')
  const [majorFilter, setMajorFilter] = useState('')
  const [classYear, setClassYear] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles').select('onboarding_complete, full_name, avatar_url').eq('id', user.id).single()
      if (profile?.onboarding_complete) { router.push('/directory'); return }
      if (profile?.full_name) setFullName(profile.full_name)
      if (profile?.avatar_url) { setAvatarUrl(profile.avatar_url); setAvatarPreview(profile.avatar_url) }
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentStep = STEPS[step]

  function canContinue() {
    if (currentStep === 'name') return firstName.trim().length >= 1 && lastName.trim().length >= 1
    if (currentStep === 'major') return major !== ''
    if (currentStep === 'class_year') return classYear !== ''
    if (currentStep === 'avatar') return true
    return false
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return }
    setAvatarPreview(URL.createObjectURL(file))
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file)
    if (error) return
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      // Save current step
      if (currentStep === 'name') {
        await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', userId)
      } else if (currentStep === 'major') {
        await supabase.from('profiles').update({ major }).eq('id', userId)
      } else if (currentStep === 'class_year') {
        await supabase.from('profiles').update({ class_year: parseInt(classYear) }).eq('id', userId)
      }
      setStep(step + 1)
    } else {
      // Final step — complete onboarding
      setSaving(true)
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', userId)
      router.push('/directory')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  const filteredMajors = SBU_MAJORS.filter(m => !majorFilter || m.toLowerCase().includes(majorFilter.toLowerCase()))

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>

        {/* Step: Name */}
        {currentStep === 'name' && (
          <div>
            <h1 className="text-[24px] font-bold tracking-tight mb-2">What&apos;s your name?</h1>
            <p className="text-[14px] text-text-muted mb-6">This is how other students will see you.</p>
            <div className="space-y-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setFullName(`${e.target.value} ${lastName}`.trim()) }}
                placeholder="First name"
                className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-[16px] outline-none focus:border-text-muted transition-colors"
                autoFocus
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setFullName(`${firstName} ${e.target.value}`.trim()) }}
                placeholder="Last name"
                className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-[16px] outline-none focus:border-text-muted transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step: Major */}
        {currentStep === 'major' && (
          <div>
            <h1 className="text-[24px] font-bold tracking-tight mb-2">What&apos;s your major?</h1>
            <p className="text-[14px] text-text-muted mb-4">You can change this later.</p>
            {major && (
              <div className="bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-accent uppercase tracking-wide font-medium">Your major</p>
                  <p className="text-[16px] font-semibold mt-0.5">{major}</p>
                </div>
                <button onClick={() => setMajor('')} className="press text-text-muted hover:text-text text-[12px]">Change</button>
              </div>
            )}
            {!major && (
              <>
                <input
                  type="text"
                  value={majorFilter}
                  onChange={(e) => setMajorFilter(e.target.value)}
                  placeholder="Search majors..."
                  className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-[14px] outline-none focus:border-text-muted transition-colors mb-3"
                  autoFocus
                />
                <div className="bg-bg-card border border-border rounded-2xl max-h-56 overflow-y-auto">
                  {filteredMajors.map(m => (
                    <button
                      key={m}
                      onClick={() => { setMajor(m); setMajorFilter('') }}
                      className="press w-full text-left px-4 py-2.5 text-[14px] border-b border-border last:border-0 hover:bg-bg-input"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Class Year */}
        {currentStep === 'class_year' && (
          <div>
            <h1 className="text-[24px] font-bold tracking-tight mb-2">Class year?</h1>
            <p className="text-[14px] text-text-muted mb-6">When do you graduate?</p>
            <div className="grid grid-cols-3 gap-2">
              {CLASS_YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => setClassYear(y.toString())}
                  className={`press py-3 rounded-2xl text-[16px] font-medium border transition-colors ${
                    classYear === y.toString()
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-card border-border hover:bg-bg-card-hover'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Avatar */}
        {currentStep === 'avatar' && (
          <div className="text-center">
            <h1 className="text-[24px] font-bold tracking-tight mb-2">Add a profile picture</h1>
            <p className="text-[14px] text-text-muted mb-8">Help people recognize you.</p>
            <label className="cursor-pointer press inline-block">
              <div className="w-32 h-32 rounded-full bg-bg-card border-2 border-border overflow-hidden mx-auto relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera size={32} className="text-text-muted" />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
            <p className="text-[12px] text-text-muted mt-4">Tap to upload a photo</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="bg-bg-card border border-border py-3 px-4 rounded-2xl press flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canContinue() || saving}
            className="flex-1 bg-accent text-white py-3 rounded-2xl font-semibold press flex items-center justify-center gap-2 disabled:opacity-40"
          >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : step === STEPS.length - 1 ? (
            <>
              {avatarUrl ? 'Get Started' : 'Skip & Get Started'}
              <ArrowRight size={16} />
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
          </button>
        </div>

        {/* Step counter */}
        <p className="text-center text-[12px] text-text-muted mt-4">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  )
}
