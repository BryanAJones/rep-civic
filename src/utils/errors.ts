// Typed error thrown by service methods when an Edge Function rejects an
// anonymous user with code: 'EMAIL_REQUIRED'. Lets call sites catch a
// specific class instead of string-matching error messages.
export class EmailRequiredError extends Error {
  constructor(message = 'Verify your email to continue.') {
    super(message);
    this.name = 'EmailRequiredError';
  }
}

// Detects the FunctionsHttpError shape returned by supabase.functions.invoke
// when the function responded with a non-2xx status. The body of the error
// response is on `context.response` as a Response object we have to read.
export async function isEmailRequiredError(error: unknown): Promise<boolean> {
  if (!error || typeof error !== 'object') return false;
  const ctx = (error as { context?: { response?: Response } }).context;
  const response = ctx?.response;
  if (!response || response.status !== 403) return false;
  try {
    const cloned = response.clone();
    const body = await cloned.json();
    return body?.code === 'EMAIL_REQUIRED';
  } catch {
    return false;
  }
}
