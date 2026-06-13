"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Avatar,
  Dropdown,
  Label,
  Separator,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import {
  CreditCard,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import { useDashboardTheme } from "./DashboardThemeProvider";
import type { DashboardUser } from "./types";

const FEEDBACK_MAILTO =
  "mailto:hello@collabwit.com?subject=Collab%20Feedback";

const menuPanelClass =
  "min-w-[280px] overflow-hidden rounded-2xl border-0 bg-zinc-800! p-1 shadow-xl shadow-zinc-950/50 [&_[data-slot=popover-overlay-arrow]]:fill-zinc-800";

const menuItemClass =
  "rounded-lg text-zinc-50 hover:bg-zinc-700 focus:bg-zinc-700 data-[hovered=true]:bg-zinc-700 data-[focus-visible=true]:bg-zinc-700";

const menuIconClass = "size-4 shrink-0 text-zinc-400";

const menuSeparatorClass = "bg-zinc-700";

const themeToggleGroupClass = cn(
  "rounded-full bg-zinc-700 p-0.5",
  "[&_.toggle-button]:h-8 [&_.toggle-button]:min-w-8 [&_.toggle-button]:rounded-full [&_.toggle-button]:bg-transparent [&_.toggle-button]:px-2 [&_.toggle-button]:text-zinc-400",
  "[&_.toggle-button[data-selected=true]]:bg-zinc-950 [&_.toggle-button[data-selected=true]]:text-zinc-50",
  "[&_.toggle-button-group__separator]:bg-zinc-600",
);

function getInitials(user: DashboardUser): string {
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "?";
}

function getAvatarSrc(user: DashboardUser): string | undefined {
  return user.avatarUrl ?? user.image ?? undefined;
}

type DashboardAccountMenuProps = {
  user: DashboardUser;
  className?: string;
};

export function DashboardAccountMenu({ user, className }: DashboardAccountMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useDashboardTheme();

  const displayName = user.name?.trim() || "Account";
  const displayEmail = user.email ?? "";
  const avatarSrc = getAvatarSrc(user);
  const initials = getInitials(user);

  function handleMenuAction(key: string | number) {
    switch (key) {
      case "profile":
        router.push(user.profileHref);
        break;
      case "feedback":
        window.location.href = FEEDBACK_MAILTO;
        break;
      case "pricing":
        router.push("/pricing");
        break;
      case "sign-out":
        startTransition(() => {
          void signOutAction();
        });
        break;
    }
  }

  return (
    <div className={className}>
      <Dropdown>
        <Dropdown.Trigger
          aria-label="Account menu"
          className={cn(
            "rounded-full outline-none transition-transform motion-reduce:transition-none",
            "active:scale-[0.97]",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <Avatar size="sm">
            {avatarSrc ? (
              <Avatar.Image alt={displayName} src={avatarSrc} />
            ) : null}
            <Avatar.Fallback delayMs={600}>{initials}</Avatar.Fallback>
          </Avatar>
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className={menuPanelClass}>
          <div className="px-3 pt-3 pb-2">
            <p className="text-sm leading-5 font-semibold text-zinc-50">
              {displayName}
            </p>
            {displayEmail ? (
              <p className="text-xs leading-4 text-zinc-400">{displayEmail}</p>
            ) : null}
          </div>
          <Dropdown.Menu
            className="text-zinc-50"
            disabledKeys={isPending ? ["sign-out"] : []}
            onAction={handleMenuAction}
          >
            <Dropdown.Section>
              <Dropdown.Item
                id="profile"
                textValue="Profile"
                className={menuItemClass}
              >
                <User className={menuIconClass} aria-hidden />
                <Label className="text-zinc-50">Profile</Label>
              </Dropdown.Item>
              <Dropdown.Item
                id="feedback"
                textValue="Provide feedback"
                className={menuItemClass}
              >
                <MessageSquare className={menuIconClass} aria-hidden />
                <Label className="text-zinc-50">Provide feedback</Label>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
          <Separator className={menuSeparatorClass} />
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-sm text-zinc-50">Theme</span>
            <ToggleButtonGroup
              selectedKeys={[theme]}
              selectionMode="single"
              disallowEmptySelection
              size="sm"
              className={themeToggleGroupClass}
              onSelectionChange={(keys) => {
                const selected = [...keys][0];
                if (
                  selected === "light" ||
                  selected === "dark" ||
                  selected === "system"
                ) {
                  setTheme(selected);
                }
              }}
            >
              <ToggleButton
                isIconOnly
                aria-label="Light theme"
                id="light"
                variant="ghost"
              >
                <Sun className="size-3.5" />
              </ToggleButton>
              <ToggleButton
                isIconOnly
                aria-label="Dark theme"
                id="dark"
                variant="ghost"
              >
                <ToggleButtonGroup.Separator className="bg-zinc-600" />
                <Moon className="size-3.5" />
              </ToggleButton>
              <ToggleButton
                isIconOnly
                aria-label="System theme"
                id="system"
                variant="ghost"
              >
                <ToggleButtonGroup.Separator className="bg-zinc-600" />
                <Monitor className="size-3.5" />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          <Separator className={menuSeparatorClass} />
          <Dropdown.Menu
            className="text-zinc-50"
            disabledKeys={isPending ? ["sign-out"] : []}
            onAction={handleMenuAction}
          >
            <Dropdown.Section>
              <Dropdown.Item
                id="pricing"
                textValue="Pricing"
                className={menuItemClass}
              >
                <CreditCard className={menuIconClass} aria-hidden />
                <Label className="text-zinc-50">Pricing</Label>
              </Dropdown.Item>
            </Dropdown.Section>
            <Separator className={menuSeparatorClass} />
            <Dropdown.Item
              id="sign-out"
              textValue="Sign out"
              className={menuItemClass}
            >
              <LogOut className={menuIconClass} aria-hidden />
              <Label className="text-zinc-50">Sign out</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
