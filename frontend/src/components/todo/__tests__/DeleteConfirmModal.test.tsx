import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('삭제 확인 메시지가 표시된다', () => {
    render(
      <DeleteConfirmModal
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isPending={false}
      />
    );

    expect(screen.getByText(/정말로 삭제하시겠습니까/)).toBeInTheDocument();
    expect(screen.getByText(/삭제된 데이터는 복구할 수 없습니다/)).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 onCancel 호출', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmModal
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isPending={false}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /취소/ });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('삭제 버튼 클릭 시 onConfirm 호출', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmModal
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isPending={false}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /^삭제$/ });
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('isPending=true 시 버튼들이 비활성화된다', () => {
    render(
      <DeleteConfirmModal
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isPending={true}
      />
    );

    expect(screen.getByRole('button', { name: /취소/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /삭제 중/ })).toBeDisabled();
  });
});
