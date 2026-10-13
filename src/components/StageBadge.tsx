import type { Stage } from "../types"

type StatusProp = {
    stage: Stage
}
export const StageBadge = ({stage}:StatusProp ) => {

    const stageColors = {
        wishlist: "bg-slate-100 text-slate-700",
        applied: "bg-blue-100 text-blue-700",
        interview: "bg-amber-100 text-amber-700",
        offer: "bg-green-100 text-green-700",
        closed: "bg-red-100 text-red-700",
      };
    

    return (
        <>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${stageColors[stage]}`}
        >
          {stage}
        </span> 
        </>
        )
}