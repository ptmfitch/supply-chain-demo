"use client";

import * as React from "react";
import { ChevronDown, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_CLASS } from "@/lib/ui/avatar-ring-styles";
import {
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  READABLE_POPOVER_ITEM_CLASS,
  filterCommandPopoverClass,
} from "@/lib/ui/popover-readability-styles";
import type { ActivityLogUserOption } from "@/lib/audit/activity-log-filter";
import { cn } from "@/lib/utils";

function UserPickerRow({
  user,
  avatarSize = 28,
}: {
  user: ActivityLogUserOption;
  avatarSize?: number;
}) {
  const avatar = resolveAvatarSourcesFromSeed(user.id, user.image);
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          AVATAR_RING_CLASS,
        )}
        style={{ width: avatarSize, height: avatarSize }}
      >
        <SafeAvatarImage
          src={avatar.src}
          fallbackSrc={avatar.fallbackSrc}
          alt=""
          width={avatarSize}
          height={avatarSize}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center leading-tight">
        <span className="truncate text-sm text-gray-700 dark:text-white">
          {user.name}
        </span>
        {user.email ? (
          <span className="truncate text-xs text-muted-foreground dark:text-white/80">
            {user.email}
          </span>
        ) : null}
      </span>
    </span>
  );
}

type ActivityUserSelectProps = {
  options: ActivityLogUserOption[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
};

/**
 * Searchable actor picker — same Command + avatar row pattern as ProductOwnerSelect.
 */
export function ActivityUserSelect({
  options,
  selectedUserId,
  onUserChange,
}: ActivityUserSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedUser = React.useMemo(
    () => options.find((user) => user.id === selectedUserId),
    [options, selectedUserId],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-auto min-h-10 w-full gap-2 px-3 py-1.5 sm:w-auto",
            "rounded-[28px] border border-sky-400/30 dark:border-sky-400/30",
            "bg-sky-100 dark:bg-sky-950/45 text-gray-700 dark:text-white",
            "shadow-sm backdrop-blur-md transition duration-200",
            "hover:border-sky-300/40 hover:bg-sky-200 dark:hover:bg-sky-900/50",
          )}
        >
          {selectedUser ? (
            <UserPickerRow user={selectedUser} avatarSize={28} />
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" />
              User
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          "p-0 w-[min(100vw-2rem,320px)]",
          filterCommandPopoverClass("sky"),
          FILTER_COMMAND_INPUT_WRAPPER_CLASS,
        )}
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search user..."
            className="bg-transparent border-0 focus:ring-0 text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
          />
          <CommandList className="max-h-[min(60vh,280px)]">
            <CommandEmpty className="text-gray-600 dark:text-white/80 text-sm text-center p-5">
              No user found.
            </CommandEmpty>
            <CommandGroup>
              {selectedUserId ? (
                <CommandItem
                  value="all users"
                  onSelect={() => {
                    onUserChange("");
                    setOpen(false);
                  }}
                  className={READABLE_POPOVER_ITEM_CLASS}
                >
                  All users
                </CommandItem>
              ) : null}
              {options.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.email}`}
                  onSelect={() => {
                    onUserChange(user.id);
                    setOpen(false);
                  }}
                  className={READABLE_POPOVER_ITEM_CLASS}
                >
                  <UserPickerRow user={user} avatarSize={28} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
