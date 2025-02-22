interface Env {
    SUPABASE_ANON_KEY: string
    SUPABASE_URL: string
    NEXT_PUBLIC_GO_API: string
    NEXT_PUBLIC_WEBSOCKET_API: string
}

const env: Env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_GO_API: process.env.NEXT_PUBLIC_GO_API || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_WEBSOCKET_API: process.env.NEXT_PUBLIC_WEBSOCKET_API || ''
};

export default env