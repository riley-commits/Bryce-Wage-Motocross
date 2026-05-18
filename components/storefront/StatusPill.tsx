import { Pill } from "@/components/ui/Pill";

export function StatusPill({
  open,
  label,
}: {
  open: boolean;
  label: string | null;
}) {
  if (open) {
    return (
      <Pill tone="red">
        {label && label.trim() ? label : "Ordering window is open"}
      </Pill>
    );
  }
  return (
    <Pill tone="navy">
      Ordering currently closed — check back soon
    </Pill>
  );
}
