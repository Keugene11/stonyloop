export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  class_year: number | null
  major: string
  second_major: string
  minor: string
  residence_hall: string
  courses: string
  gender: string
  relationship_status: string
  interests: string
  about_me: string
  political_views: string
  favorite_quotes: string
  last_seen: string | null
  created_at: string
  updated_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  requester?: Profile
  addressee?: Profile
}

export interface WallPost {
  id: string
  author_id: string
  wall_owner_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface Poke {
  id: string
  poker_id: string
  poked_id: string
  created_at: string
  seen: boolean
  poker?: Profile
  poked?: Profile
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_at: string
  created_at: string
  user1?: Profile
  user2?: Profile
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}
