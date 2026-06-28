import { NextResponse } from 'next/server';

const ROLES = ['Admin', 'Developer', 'Manager', 'Analyst', 'Designer'];
const STATUSES = ['Active', 'Inactive', 'Pending'];
const FIRST = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
const LAST  = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

const ALL_USERS = Array.from({ length: 87 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last  = LAST[i % LAST.length];
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i > 9 ? i : ''}@example.com`,
    role: ROLES[i % ROLES.length],
    status: STATUSES[i % STATUSES.length],
    joinDate: new Date(2021 + (i % 3), i % 12, (i % 27) + 1).toISOString().split('T')[0],
    salary: 45000 + (i % 10) * 8500,
  };
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { page = 1, size = 10, searchKey = '', sort } = body as {
    page?: number;
    size?: number;
    searchKey?: string;
    sort?: { key: string; dir: 'asc' | 'desc' };
  };

  let filtered = ALL_USERS;

  if (searchKey) {
    const q = searchKey.toLowerCase();
    filtered = ALL_USERS.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.status.toLowerCase().includes(q)
    );
  }

  if (sort?.key) {
    filtered = [...filtered].sort((a, b) => {
      const va = String((a as Record<string, unknown>)[sort.key] ?? '');
      const vb = String((b as Record<string, unknown>)[sort.key] ?? '');
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sort.dir === 'desc' ? -cmp : cmp;
    });
  }

  const total = filtered.length;
  const data = filtered.slice((page - 1) * size, page * size);

  // Simulate network latency
  await new Promise(r => setTimeout(r, 200));

  return NextResponse.json({ data, total });
}
