import Button from './Button';

export function RowActions({ onEdit, onDelete, onView, writable = true }) {
  if (!writable && !onView) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {onView && <Button size="sm" variant="secondary" type="button" onClick={onView}>View</Button>}
      {writable && onEdit && <Button size="sm" variant="secondary" type="button" onClick={onEdit}>Edit</Button>}
      {writable && onDelete && <Button size="sm" variant="danger" type="button" onClick={onDelete}>Delete</Button>}
    </div>
  );
}

export function FormActions({ onCancel, submitLabel = 'Save', cancelLabel = 'Cancel', className = 'sm:col-span-2' }) {
  return (
    <div className={`mt-2 flex justify-end gap-2 ${className}`}>
      <Button variant="secondary" type="button" onClick={onCancel}>{cancelLabel}</Button>
      <Button type="submit">{submitLabel}</Button>
    </div>
  );
}
