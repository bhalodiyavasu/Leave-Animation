import { Search } from "lucide-react";
import { Input } from "../ui/input";

interface SearchbarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Searchbar = ({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchbarProps) => {
  return (
    <div className={`flex-1 max-w-xl ${className}`}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="pl-10 bg-popover dark:bg-popover border-border dark:border-border text-sm focus-visible:ring-2 focus-visible:ring-inset"
        />
      </div>
    </div>
  );
};
