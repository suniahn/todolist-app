import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategoryMutations';
import { DeleteConfirmModal } from '../components/todo/DeleteConfirmModal';
import { ThemeToggle } from '../components/common/ThemeToggle';

export function CategoryPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categoriesData } = useCategories();
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();

  const currentUser = useAuthStore((s) => s.currentUser);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const categories = categoriesData ?? [];
  const defaultCategories = categories.filter((c) => c.is_default);
  const userCategories = categories.filter((c) => !c.is_default);

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) return;
    createCategory(
      { name: trimmed },
      {
        onSuccess: () => {
          setAddName('');
          setShowAddForm(false);
        },
      },
    );
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed || !editingId) return;
    updateCategory(
      { id: editingId, payload: { name: trimmed } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditName('');
        },
      },
    );
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  return (
    <>
      <header className="app-header">
        <h1 className="app-header-title">TodoListApp</h1>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          {currentUser && <span>{currentUser.name}님</span>}
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 desktop:px-6 py-6">
        <div className="mb-6">
          <button
            className="btn btn-ghost text-sm"
            onClick={() => navigate('/')}
          >
            ← 할일 목록으로
          </button>
          <h2 className="text-xl font-semibold text-text-primary mt-2">카테고리 관리</h2>
        </div>

        <section className="card mb-6">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-text-primary">기본 카테고리</h3>
            <p className="text-sm text-text-secondary">시스템에서 제공하는 기본 카테고리입니다.</p>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {defaultCategories.map((c) => (
              <span key={c.id} className="category-chip">{c.name}</span>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">나의 카테고리</h3>
              <p className="text-sm text-text-secondary">직접 만든 카테고리입니다.</p>
            </div>
            <button
              className="btn btn-fab"
              onClick={() => setShowAddForm(true)}
            >
              + 카테고리 추가
            </button>
          </div>

          {showAddForm && (
            <div className="p-4 border-b border-border bg-background">
              <form onSubmit={handleCreate}>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="카테고리 이름"
                    maxLength={50}
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={isCreating}>
                    추가
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setShowAddForm(false); setAddName(''); }}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {userCategories.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <p>아직 나만의 카테고리가 없습니다</p>
              <p className="text-sm">카테고리를 추가하여 할일을 더 세분화하세요!</p>
            </div>
          ) : (
            <ul>
              {userCategories.map((c) => (
                <li key={c.id} className="p-4 flex items-center gap-3 border-b border-border last:border-0">
                  {editingId === c.id ? (
                    <form onSubmit={handleUpdate} className="flex gap-2 flex-1">
                      <input
                        className="input flex-1"
                        maxLength={50}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                        저장
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => { setEditingId(null); setEditName(''); }}
                      >
                        취소
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 text-text-primary">{c.name}</span>
                      <button
                        className="btn btn-ghost h-8 px-2 text-xs"
                        onClick={() => startEditing(c.id, c.name)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger h-8 px-2 text-xs"
                        onClick={() => setDeletingId(c.id)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {deletingId && (
        <DeleteConfirmModal
          onConfirm={() => {
            deleteCategory(deletingId);
            setDeletingId(null);
          }}
          onCancel={() => setDeletingId(null)}
          isPending={isDeleting}
        />
      )}
    </>
  );
}
