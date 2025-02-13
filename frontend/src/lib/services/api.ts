const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    || (process.env.NEXT_PUBLIC_NODE_ENV === 'dev'
        ? 'http://localhost:8000' 
        : 'https://shrillecho.app/api')

console.log(process.env.NEXT_PUBLIC_NODE_ENV)
export const api = {
    get: async (endpoint: string) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        return response.json()
    },
    post: async (endpoint: string, data?: any) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        return response.json()
    }
}