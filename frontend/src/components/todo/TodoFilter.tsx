import type { Category } from '../../types/domain';
import type { TodoFilters } from '../../types/api';

interface TodoFilterProps {
  filters: TodoFilters;
  categories: Category[];
  onChange: (filters: TodoFilters) => void;
}

export function TodoFilter({ filters, categories, onChange }: TodoFilterProps) {
  const handleCategoryChange = (value: string) => {
    onChange({ ...filters, category_id: value === '' ? undefined : value });
  };

  const handleCompletedChange = (value: string) => {
    const is_completed =
      value === 'true' ? true : value === 'false' ? false : undefined;
    onChange({ ...filters, is_completed });
  };

  const handleScheduleChange = (value: string) => {
    const schedule_status =
      value === 'ongoing' || value === 'overdue' ? value : undefined;
    onChange({ ...filters, schedule_status });
  };

  return (
    <div className="card p-4 desktop:p-5 mb-4">
      <div className="flex flex-col desktop:flex-row gap-4">
        <div className="field flex-1">
          <label className="field-label">카테고리</label>
          <select
            className="input"
            value={filters.category_id ?? ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">전체</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field flex-1">
          <label className="field-label">완료 여부</label>
          <select
            className="input"
            value={
              filters.is_completed === undefined
                ? ''
                : String(filters.is_completed)
            }
            onChange={(e) => handleCompletedChange(e.target.value)}
          >
            <option value="">전체</option>
            <option value="false">미완료만</option>
            <option value="true">완료만</option>
          </select>
        </div>

        <div className="field flex-1">
          <label className="field-label">일정 상태</label>
          <div className="flex items-center gap-4 h-[44px]">
            {(
              [
                { value: '', label: '전체' },
                { value: 'ongoing', label: '진행 중' },
                { value: 'overdue', label: '기간초과' },
              ] as const
            ).map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-1.5 cursor-pointer text-text-primary"
              >
                <input
                  type="radio"
                  name="schedule_status"
                  value={value}
                  checked={(filters.schedule_status ?? '') === value}
                  onChange={() => handleScheduleChange(value)}
                  className="accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
