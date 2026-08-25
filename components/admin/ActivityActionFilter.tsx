"use client";

import React from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { FilterCommandCheckboxItem } from "@/lib/ui/filter-command-item";
import { AuditActionBadge, formatSemanticLabel } from "@/lib/ui/semantic-badges";
import { ACTIVITY_ACTION_OPTIONS } from "@/lib/audit/activity-log-filter";
import {
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  filterCommandPopoverClass,
} from "@/lib/ui/popover-readability-styles";
import { cn } from "@/lib/utils";

type ActivityActionFilterProps = {
  selectedActions: string[];
  setSelectedActions: React.Dispatch<React.SetStateAction<string[]>>;
};

export function ActivityActionFilter({
  selectedActions,
  setSelectedActions,
}: ActivityActionFilterProps) {
  const [open, setOpen] = React.useState(false);

  function handleToggle(value: string) {
    setSelectedActions((prev) =>
      prev.includes(value) ? prev.filter((action) => action !== value) : [...prev, value],
    );
  }

  return (
    <div className="flex items-center space-x-4 poppins">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-sky-100 dark:bg-sky-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:bg-sky-200 dark:hover:bg-sky-900/50 dark:hover:border-sky-300/40"
          >
            <Zap className="h-4 w-4 mr-1" />
            Action
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 w-52 poppins",
            filterCommandPopoverClass("sky"),
            FILTER_COMMAND_INPUT_WRAPPER_CLASS,
          )}
          side="bottom"
          align="center"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Filter by action..."
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandGroup>
                {ACTIVITY_ACTION_OPTIONS.map((action) => (
                  <FilterCommandCheckboxItem
                    key={action}
                    value={formatSemanticLabel(action)}
                    toggleValue={action}
                    checked={selectedActions.includes(action)}
                    onToggle={handleToggle}
                    className="focus:bg-sky-100 dark:focus:bg-white/10"
                    checkboxClassName="focus:ring-sky-500/50"
                  >
                    <AuditActionBadge action={action} size="compact" />
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandEmpty className="text-gray-600 dark:text-white/80 text-sm text-center p-5">
              No action found.
            </CommandEmpty>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                variant="ghost"
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-sky-100 dark:hover:bg-white/10"
                onClick={() => setSelectedActions([])}
              >
                Clear Filters
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
