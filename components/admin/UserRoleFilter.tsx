import { cn } from "@/lib/utils";
import {
  filterCommandPopoverClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
} from "@/lib/ui/popover-readability-styles";

/**
 * User Management Role Filter Dropdown
 * Colored glass badges per role (matches TicketStatusFilter pattern)
 */

import React from "react";
import { Users } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { FilterCommandCheckboxItem } from "@/lib/ui/filter-command-item";
import { UserRoleBadge } from "@/lib/ui/semantic-badges";
import type { UserRole } from "@/types";

export const USER_ROLE_FILTER_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "supplier", label: "Supplier" },
  { value: "client", label: "Client" },
  { value: "retailer", label: "Retailer" },
];

type UserRoleDropDownProps = {
  selectedRoles: string[];
  setSelectedRoles: React.Dispatch<React.SetStateAction<string[]>>;
};

export function UserRoleDropDown({
  selectedRoles,
  setSelectedRoles,
}: UserRoleDropDownProps) {
  const [open, setOpen] = React.useState(false);

  function handleToggle(value: string) {
    setSelectedRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );
  }

  function clearFilters() {
    setSelectedRoles([]);
  }

  return (
    <div className="flex items-center space-x-4 poppins">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-10 rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-rose-100 dark:bg-rose-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-rose-300/40 hover:bg-rose-200 dark:hover:bg-rose-900/50 dark:hover:border-rose-300/40 hover:bg-rose-200 dark:hover:bg-rose-900/50 gap-2"
          >
            <Users className="h-4 w-4" />
            Role
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 w-48 poppins",
            filterCommandPopoverClass("rose"),
            FILTER_COMMAND_INPUT_WRAPPER_CLASS,
          )}
          side="bottom"
          align="center"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Filter by role..."
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandGroup>
                {USER_ROLE_FILTER_OPTIONS.map((role) => (
                  <FilterCommandCheckboxItem
                    key={role.value}
                    value={role.label}
                    toggleValue={role.value}
                    checked={selectedRoles.includes(role.value)}
                    onToggle={handleToggle}
                  >
                    <UserRoleBadge role={role.value} />
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandEmpty className="text-gray-600 dark:text-white/80 text-sm text-center p-5">
              No role found.
            </CommandEmpty>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                variant="ghost"
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-rose-100 dark:hover:bg-white/10"
                onClick={clearFilters}
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
