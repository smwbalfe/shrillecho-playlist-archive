interface Env {
    SUPABASE_ANON_KEY: string;
    SUPABASE_URL: string;
    NEXT_PUBLIC_GO_API: string;
    NEXT_PUBLIC_WEBSOCKET_API: string;
}

function validateEnv(env: Env): void {
    const missingVars: string[] = [];

    // Check each environment variable
    if (!env.SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
    if (!env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
    if (!env.NEXT_PUBLIC_GO_API) missingVars.push('NEXT_PUBLIC_GO_API');
    if (!env.NEXT_PUBLIC_WEBSOCKET_API) missingVars.push('NEXT_PUBLIC_WEBSOCKET_API');

    // If any variables are missing, throw an error with a clear message
    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missingVars.map(v => `- ${v}`).join('\n')}\n\nPlease check your .env file and ensure all required variables are set.`
        );
    }
}

const env: Env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_GO_API: process.env.NEXT_PUBLIC_GO_API || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_WEBSOCKET_API: process.env.NEXT_PUBLIC_WEBSOCKET_API || ''
};

// Validate environment variables before exportings
validateEnv(env);

console.log('Environment variables loaded successfully:', env);

export default env;