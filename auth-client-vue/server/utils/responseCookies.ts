/**
 * Forward Set-Cookie from backend response to client.
 */

import type { H3Event } from 'h3';

export function forwardSetCookie(event: H3Event, response: Response): void {
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    setHeader(event, 'set-cookie', setCookie);
  }
}
