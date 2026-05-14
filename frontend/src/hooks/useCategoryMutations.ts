import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories';
import { useToast } from '../components/common/Toast';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../types/api';

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      categoriesApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('카테고리가 추가되었습니다');
    },
    onError: () => {
      showToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      categoriesApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('카테고리가 수정되었습니다');
    },
    onError: () => {
      showToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('카테고리가 삭제되었습니다');
    },
    onError: () => {
      showToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    },
  });
}
