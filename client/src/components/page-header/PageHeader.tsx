import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-row items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
      <div className="flex-1 min-w-0">
        <h1 className="text-gray-800 dark:text-gray-100 truncate text-xl font-medium">
          {title}
        </h1>
        {description && <div className="text-gray-500">{description}</div>}
      </div>
      {actions && (
        <div className="flex-1 flex items-center justify-end gap-2 max-lg:flex-wrap max-lg:justify-start max-lg:w-full">
          {actions}
        </div>
      )}
    </div>
  );
};
