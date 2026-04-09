export interface University {
  slug: string
  name: string
  shortName: string
  emailDomain: string
}

export const UNIVERSITIES: University[] = [
  { slug: 'harvard', name: 'Harvard University', shortName: 'Harvard', emailDomain: 'harvard.edu' },
  { slug: 'yale', name: 'Yale University', shortName: 'Yale', emailDomain: 'yale.edu' },
  { slug: 'princeton', name: 'Princeton University', shortName: 'Princeton', emailDomain: 'princeton.edu' },
  { slug: 'columbia', name: 'Columbia University', shortName: 'Columbia', emailDomain: 'columbia.edu' },
  { slug: 'upenn', name: 'University of Pennsylvania', shortName: 'Penn', emailDomain: 'upenn.edu' },
  { slug: 'brown', name: 'Brown University', shortName: 'Brown', emailDomain: 'brown.edu' },
  { slug: 'dartmouth', name: 'Dartmouth College', shortName: 'Dartmouth', emailDomain: 'dartmouth.edu' },
  { slug: 'cornell', name: 'Cornell University', shortName: 'Cornell', emailDomain: 'cornell.edu' },
  { slug: 'stanford', name: 'Stanford University', shortName: 'Stanford', emailDomain: 'stanford.edu' },
  { slug: 'caltech', name: 'California Institute of Technology', shortName: 'Caltech', emailDomain: 'caltech.edu' },
  { slug: 'stonybrook', name: 'Stony Brook University', shortName: 'Stony Brook', emailDomain: 'stonybrook.edu' },
]

export const APPROVED_DOMAINS = UNIVERSITIES.map(u => u.emailDomain)

export function getUniversityByEmail(email: string): University | null {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  return UNIVERSITIES.find(u => u.emailDomain === domain) ?? null
}

export function getUniversityBySlug(slug: string): University | null {
  return UNIVERSITIES.find(u => u.slug === slug) ?? null
}

export function isApprovedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return APPROVED_DOMAINS.includes(domain)
}

// Schools to show on login page (Ivy League + Stanford + Caltech, not SBU)
export const LOGIN_DISPLAY_SCHOOLS = UNIVERSITIES.filter(u => u.slug !== 'stonybrook')
