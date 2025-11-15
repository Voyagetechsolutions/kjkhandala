// Global types for Supabase Edge Functions (Deno environment)
declare global {
  const Deno: {
    serve: (handler: (req: Request) => Promise<Response> | Response) => void;
    env: {
      get: (key: string) => string | undefined;
    };
  };
}

export {};
