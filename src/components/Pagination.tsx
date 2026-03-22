import React from 'react';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize?: (ps: number) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

const Pagination: React.FC<PaginationProps> = ({ total, page, pageSize, onPage, onPageSize }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
    background: active ? 'var(--primary)' : '#fff',
    color: active ? '#fff' : 'var(--text)',
    fontWeight: active ? 700 : 400,
    fontSize: 13,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
      <span className="text-muted text-sm" style={{ marginRight: 8 }}>
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <button style={btnStyle(false)} disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
        ) : (
          <button key={p} style={btnStyle(p === page)} onClick={() => onPage(p as number)}>{p}</button>
        )
      )}
      <button style={btnStyle(false)} disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
      {onPageSize && (
        <select
          value={pageSize}
          onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          style={{ marginLeft: 12, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 }}
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
        </select>
      )}
    </div>
  );
};

export default Pagination;
