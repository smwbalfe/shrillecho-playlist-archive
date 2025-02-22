interface Env {
    SUPABASE_ANON_KEY: string
    SUPABASE_URL: string
    NEXT_PUBLIC_GO_API: string
}

const env: Env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_GO_API: process.env.NEXT_PUBLIC_GO_API || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

export default env