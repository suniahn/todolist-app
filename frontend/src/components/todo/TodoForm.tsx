import { useState } from 'react';
import type { Category } from '../../types/domain';
import type { CreateTodoPayload } from '../../types/api';

interface TodoFormProps {
  initialValues?: {
    title?: string;
    description?: string;
    start_date?: string;
    due_date?: string;
    category_id?: string;
  };
  categories: Category[];
  onSubmit: (payload: CreateTodoPayload) => void;
  isPending: boolean;
  submitLabel?: string;
  onCancel: () => void;
}

export function TodoForm({
  initialValues,
  categories,
  onSubmit,
  isPending,
  submitLabel = '등록',
  onCancel,
}: TodoFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [startDate, setStartDate] = useState(initialValues?.start_date ?? '');
  const [dueDate, setDueDate] = useState(initialValues?.due_date ?? '');
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? '');

  const isDateInvalid = startDate !== '' && dueDate !== '' && dueDate < startDate;

  const isValid =
    title.trim().length > 0 &&
    title.length <= 200 &&
    description.length <= 1000 &&
    startDate !== '' &&
    dueDate !== '' &&
    !isDateInvalid &&
    categoryId !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isPending) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() !== '' ? description.trim() : undefined,
      start_date: startDate,
      due_date: dueDate,
      category_id: categoryId,
    });
  };

  return (
    <main className="max-w-[640px] mx-auto px-4 py-6">
      <div className="card p-8">
        <h2 className="text-lg font-medium text-text-primary mb-6">{submitLabel === '저장' ? '할일 수정' : '새로운 할일 추가'}</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="todo-title" className="field-label">
              제목 <span className="text-danger">*</span>
            </label>
            <input
              id="todo-title"
              className={`input${title.length > 200 ? ' input-error' : ''}`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="할일 제목을 입력하세요"
            />
            <span className="field-hint">{title.length} / 200</span>
          </div>

          <div className="field">
            <label htmlFor="todo-description" className="field-label">
              설명
            </label>
            <textarea
              id="todo-description"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder="설명을 입력하세요 (선택)"
            />
            <span className="field-hint">{description.length} / 1000</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="todo-start-date" className="field-label">
                시작일 <span className="text-danger">*</span>
              </label>
              <input
                id="todo-start-date"
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="todo-due-date" className="field-label">
                종료예정일 <span className="text-danger">*</span>
              </label>
              <input
                id="todo-due-date"
                className={`input${isDateInvalid ? ' input-error' : ''}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {isDateInvalid && (
            <p className="field-error">종료예정일은 시작일보다 이전일 수 없습니다</p>
          )}

          <div className="field">
            <label htmlFor="todo-category" className="field-label">
              카테고리 <span className="text-danger">*</span>
            </label>
            <select
              id="todo-category"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isPending}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || !isValid}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
