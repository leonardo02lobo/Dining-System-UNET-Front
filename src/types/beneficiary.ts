export type BeneficiaryStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export type UserType = 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE' | 'WORKER'

export interface Beneficiary {
  id: number
  first_name: string
  last_name: string
  document_id: string
  card_code: string | null
  email?: string | null
  gender?: string | null
  user_type: UserType
  career?: string | null
  is_priority: boolean
  status: BeneficiaryStatus
  created_at: string
  updated_at: string | null
}

export interface BeneficiaryCreate {
  first_name: string
  last_name: string
  document_id: string
  card_code?: string
  email?: string
  gender?: string
  user_type: UserType
  career?: string
  is_priority?: boolean
  status?: BeneficiaryStatus
}

export interface BeneficiaryUpdate {
  first_name?: string
  last_name?: string
  card_code?: string
  email?: string
  gender?: string
  user_type?: UserType
  career?: string
  is_priority?: boolean
  status?: BeneficiaryStatus
}

export interface BeneficiaryVerifyResult {
  document_id: string
  first_name: string
  last_name: string
  status: BeneficiaryStatus
  is_priority: boolean
}

export interface BeneficiaryFilters {
  skip?: number
  limit?: number
  search?: string
  status?: BeneficiaryStatus
  user_type?: UserType
}

/** El endpoint /lookup retorna la misma forma que BeneficiaryResponse */
export type BeneficiaryLookupResult = Beneficiary

export interface PaginatedBeneficiaries {
  items: Beneficiary[]
  total: number
}
