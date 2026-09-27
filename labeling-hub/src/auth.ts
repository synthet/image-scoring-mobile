import type { Context, Next } from 'hono';

export type HubBindings = {
  mobileToken: string;
  machineToken: string;
};

function parseBearer(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim();
}

export function requireMobileAuth(bindings: HubBindings) {
  return async (c: Context, next: Next) => {
    const token = parseBearer(c.req.header('Authorization'));
    if (!token || token !== bindings.mobileToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  };
}

export function requireMachineAuth(bindings: HubBindings) {
  return async (c: Context, next: Next) => {
    const token = parseBearer(c.req.header('Authorization'));
    if (!token || token !== bindings.machineToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  };
}
