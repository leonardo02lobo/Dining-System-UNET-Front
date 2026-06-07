export interface LoginAuditEntry {
    id: number
    user_id: number
    user_name: string
    user_email: string
    user_role: string
    ip_address: string | null
    user_agent: string | null
    logged_at: string
}

export interface LoginAuditListResponse {
    total: number
    items: LoginAuditEntry[]
}
