import { HttpHeaders } from '@angular/common/http';

/** Where container.WEB saves the tenant code after loading `GET /tenant` (see container.WEB `tenant-storage.ts`). */
const STORAGE_KEY = 'container.tenantCode';
const DEFAULT_TENANT_CODE = 'default';

/** The `X-Tenant-Id` header the bot needs on every `/admin/knowledge` call. */
export function tenantHeaders(): HttpHeaders {
  let code = DEFAULT_TENANT_CODE;
  try {
    code = localStorage.getItem(STORAGE_KEY) || DEFAULT_TENANT_CODE;
  } catch {
    // storage unavailable (private mode): fall back to the default tenant
  }
  return new HttpHeaders({ 'X-Tenant-Id': code });
}
