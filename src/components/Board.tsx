import type { Job, Status } from "../types/app";
import { STATUSES } from "../types/app";
import Column from "./Column";

export default function Board({
  jobsByStatus,
  onEdit,
  onDelete,
  onMove,
  readOnly,
}: {
  jobsByStatus: Record<Status, Job[]>;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
  readOnly: boolean;
}) {
  return (
    <div
      className="
        mt-2
        flex gap-4 overflow-x-auto pb-2
        snap-x snap-mandatory
        md:grid md:grid-cols-2 md:overflow-visible md:snap-none
        xl:grid-cols-4
      "
    >
      {STATUSES.map((s) => (
        <Column
          key={s}
          status={s}
          jobs={jobsByStatus[s]}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
