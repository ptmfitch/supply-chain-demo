"use client";

import React from "react";
import { Boxes } from "lucide-react";
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
import { formatSemanticLabel } from "@/lib/ui/semantic-badges";
import { ACTIVITY_ENTITY_OPTIONS } from "@/lib/audit/activity-log-filter";
import {
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  filterCommandPopoverClass,
} from "@/lib/ui/popover-readability-styles";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";
import { cn } from "@/lib/utils";

type ActivityEntityFilterProps = {
  selectedEntities: string[];
  setSelectedEntities: React.Dispatch<React.SetStateAction<string[]>>;
};

export function ActivityEntityFilter({
  selectedEntities,
  setSelectedEntities,
}: ActivityEntityFilterProps) {
  const [open, setOpen] = React.useState(false);

  function handleToggle(value: string) {
    setSelectedEntities((prev) =>
      prev.includes(value)
        ? prev.filter((entity) => entity !== value)
        : [...prev, value],
    );
  }

  return (
    <div className="flex items-center space-x-4 poppins">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-violet-300/40 hover:bg-violet-200 dark:hover:bg-violet-900/50 dark:hover:border-violet-300/40"
          >
            <Boxes className="h-4 w-4 mr-1" />
            Entity
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 w-52 poppins",
            filterCommandPopoverClass("violet"),
            FILTER_COMMAND_INPUT_WRAPPER_CLASS,
          )}
          side="bottom"
          align="center"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Filter by entity..."
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandGroup>
                {ACTIVITY_ENTITY_OPTIONS.map((entity) => (
                  <FilterCommandCheckboxItem
                    key={entity}
                    value={formatSemanticLabel(entity)}
                    toggleValue={entity}
                    checked={selectedEntities.includes(entity)}
                    onToggle={handleToggle}
                    className="focus:bg-violet-100 dark:focus:bg-white/10"
                    checkboxClassName="focus:ring-violet-500/50"
                  >
                    <span className={FILTER_CHIP_COLLAPSED_CLASS}>
                      {formatSemanticLabel(entity)}
                    </span>
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandEmpty className="text-gray-600 dark:text-white/80 text-sm text-center p-5">
              No entity found.
            </CommandEmpty>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                variant="ghost"
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-violet-100 dark:hover:bg-white/10"
                onClick={() => setSelectedEntities([])}
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
