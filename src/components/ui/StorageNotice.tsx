interface StorageNoticeProps {
  recovered: boolean;
}

function StorageNotice({ recovered }: StorageNoticeProps) {
  if (!recovered) {
    return null;
  }

  return (
    <div className="alert" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
      Storage data was reset to a clean state because the saved data was missing or invalid.
    </div>
  );
}

export default StorageNotice;
