const USER_ID_KEY = 'rag_app_user_id'

export function getOrCreateUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY)

    if (!userId) {
        userId = crypto.randomUUID()
        localStorage.setItem(USER_ID_KEY, userId)
    }

    return userId
}