import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  emptyMessage = 'No data found',
}) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 dark:border-brand-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`} style={{ textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : ''}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3 ${col.className || ''}`} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
