import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export default function SortableHeader({ 
  label, 
  sortKey, 
  currentSort, 
  currentDirection, 
  onSort, 
  className = "" 
}) {
  const isActive = currentSort === sortKey;
  
  const handleClick = () => {
    if (isActive) {
      onSort(sortKey, currentDirection === "asc" ? "desc" : "asc");
    } else {
      onSort(sortKey, "asc");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 hover:text-red-600 transition-colors group ${className}`}
      data-testid={`sort-${sortKey}`}
    >
      <span>{label}</span>
      {isActive ? (
        currentDirection === "asc" ? (
          <ChevronUp className="w-4 h-4 text-red-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-red-600" />
        )
      ) : (
        <ChevronsUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />
      )}
    </button>
  );
}
