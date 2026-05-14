interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function DeleteConfirmModal({ onConfirm, onCancel, isPending }: DeleteConfirmModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="text-lg font-medium text-text-primary mb-2">할일 삭제</h2>
        <hr className="border-border my-3" />
        <p className="text-sm text-text-secondary mb-6">
          정말로 삭제하시겠습니까?
          <br />
          삭제된 데이터는 복구할 수 없습니다.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isPending}>
            취소
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
