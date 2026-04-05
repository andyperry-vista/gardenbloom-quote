import { Leaf } from "lucide-react";

export default function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent/60" />
      <Leaf className="w-4 h-4 text-accent/50 rotate-[-30deg]" />
      <div className="h-px w-24 bg-accent/40" />
      <Leaf className="w-4 h-4 text-accent/50 rotate-[30deg] scale-x-[-1]" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent/60" />
    </div>
  );
}
