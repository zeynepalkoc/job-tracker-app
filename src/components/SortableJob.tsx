import type { Job, Status } from "../types/app";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import JobCard from "./JobCard";

export default function SortableJob({
  job,
  onEdit,
  onDelete,
  onMove,
  readOnly,
}: {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
  readOnly: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} onEdit={onEdit} onDelete={onDelete} onMove={onMove} readOnly={readOnly} />
    </div>
  );
}
