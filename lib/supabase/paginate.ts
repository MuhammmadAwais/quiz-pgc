export const SUPABASE_PAGE_SIZE = 1000;

export interface PaginatedQueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
  count?: number | null;
}

/**
 * Fetches every row across PostgREST's per-request row cap by paging with `.range()`.
 * Callers MUST include a deterministic `.order(...)` (e.g. ending with `.order('id')`)
 * so rows cannot shift across page boundaries.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PaginatedQueryResult<T>>,
  pageSize: number = SUPABASE_PAGE_SIZE
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error, count } = await fetchPage(offset, offset + pageSize - 1);
    if (error) {
      return { data: rows, error };
    }
    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (typeof count === 'number') {
      if (rows.length >= count) {
        break;
      }
    } else if (data.length < pageSize) {
      break;
    }

    offset += data.length;
  }

  return { data: rows, error: null };
}
