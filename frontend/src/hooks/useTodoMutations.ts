import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { todosApi } from '../api/todos';
import { useToast } from '../components/common/Toast';
import type { CreateTodoPayload, UpdateTodoPayload } from '../types/api';

export function useToggleTodo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => todosApi.toggleTodo(id),
    onSuccess: (todo) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if (todo.is_completed) {
        showToast('할일이 완료되었습니다', 'success');
      } else {
        showToast('할일이 미완료 상태로 복원되었습니다', 'success');
      }
    },
    onError: () => {
      showToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    },
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: CreateTodoPayload) => todosApi.createTodo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      navigate('/');
    },
    onError: () => {
      showToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTodoPayload }) =>
      todosApi.updateTodo(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      navigate('/');
    },
    onError: () => {
      showToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => todosApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('할일이 삭제되었습니다', 'success');
    },
    onError: () => {
      showToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    },
  });
}
