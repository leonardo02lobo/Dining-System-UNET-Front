export interface LoginAuditEntry {
    id: number
    /** Nulo si la cuenta ya fue eliminada; `user_name` conserva quién entró. */
    user_id: number | null
    user_name: string
    user_email: string
    user_role: string
    ip_address: string | null
    user_agent: string | null
    logged_at: string
    /**
     * Procesos que cuelgan de esta sesión. `0` también en las sesiones anteriores al enlace
     * por `sid`, que no tienen ninguno atado: el panel lo dice en vez de dejar el hueco.
     */
    process_count: number
}

export interface LoginAuditListResponse {
    total: number
    items: LoginAuditEntry[]
}

/** Antes y después de un campo modificado. El valor viene ya redactado si era sensible. */
export interface AuditFieldChange {
    antes: unknown
    después: unknown
}

/**
 * Una entrada del historial de procesos.
 *
 * `user_id` es nulo cuando la cuenta que actuó ya fue eliminada: la identidad sigue en
 * `actor_name`/`actor_email`/`actor_role`, que el servidor guarda en el momento de actuar
 * precisamente para ese caso (y porque el rol de entonces no es el de hoy).
 */
export interface AuditEntry {
    id: number
    user_id: number | null
    /** Sesión en la que ocurrió. Nulo en los procesos anteriores al enlace por sesión. */
    login_audit_id: number | null
    actor_name: string | null
    actor_email: string | null
    actor_role: string | null
    action: string
    resource: string
    resource_id: string | null
    details: string | null
    changes: Record<string, AuditFieldChange> | null
    method: string | null
    path: string | null
    status_code: number | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

export interface AuditEntryListResponse {
    total: number
    items: AuditEntry[]
}

/** Acciones y recursos presentes en el historial, para llenar los desplegables. */
export interface AuditFilterCatalog {
    actions: string[]
    resources: string[]
}
