import { useEffect } from "react";

export interface UseGlobalShortcutsOptions {
  /** Callback to toggle video play / pause on 'Space' or 'K' key */
  onTogglePlay?: () => void;
  /** Callback to seek backward (e.g. 5 seconds) on 'ArrowLeft' */
  onSeekBackward?: (seconds: number) => void;
  /** Callback to seek forward (e.g. 5 seconds) on 'ArrowRight' */
  onSeekForward?: (seconds: number) => void;
  /** Alternative unified relative seek callback */
  onSeekRelative?: (deltaSeconds: number) => void;
  /** Callback to save edits on 'Ctrl + Enter' or 'Cmd + Enter' */
  onSaveEdits?: () => void;
  /** Callback to toggle keyboard shortcuts modal on '?' */
  onToggleShortcutsModal?: () => void;
  /** Callback to toggle subtitles on 'C' */
  onToggleSubtitles?: () => void;
  /** Callback to toggle mute on 'M' */
  onToggleMute?: () => void;
  /** Enable or disable the listener, default is true */
  enabled?: boolean;
}

/**
 * Checks if the target element is an active text input or editable container.
 */
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === "input") {
    const input = element as HTMLInputElement;
    const nonTextTypes = ["button", "checkbox", "radio", "submit", "reset", "file", "range", "color"];
    return !nonTextTypes.includes(input.type.toLowerCase());
  }

  if (tagName === "textarea" || tagName === "select") {
    return true;
  }

  return element.isContentEditable;
}

/**
 * Custom hook to listen for global keyboard events:
 * - 'Space': Play / Pause (when not typing in an input/textarea)
 * - 'ArrowLeft': Seek 5 seconds backward (when not typing in an input/textarea)
 * - 'ArrowRight': Seek 5 seconds forward (when not typing in an input/textarea)
 * - 'Ctrl + Enter' / 'Cmd + Enter': Save edits in the subtitle list (even when typing in an input/textarea)
 */
export function useGlobalShortcuts({
  onTogglePlay,
  onSeekBackward,
  onSeekForward,
  onSeekRelative,
  onSaveEdits,
  onToggleShortcutsModal,
  onToggleSubtitles,
  onToggleMute,
  enabled = true,
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isInput = isInputElement(event.target);

      // 1. 'Ctrl + Enter' or 'Cmd + Enter' (Save Subtitle Edits)
      // Works even when user is focused inside a textarea/input!
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();

        // If currently editing inside an input/textarea, blur it to complete editing
        if (isInput && event.target instanceof HTMLElement) {
          event.target.blur();
        }

        onSaveEdits?.();
        return;
      }

      // If user is actively typing in an input, textarea, or contentEditable,
      // do not hijack other hotkeys
      if (isInput) {
        return;
      }

      // 2. '?' or 'Shift + /' or 'F1' (Toggle shortcuts modal)
      if (event.key === "?" || (!event.ctrlKey && !event.metaKey && event.key === "F1")) {
        event.preventDefault();
        onToggleShortcutsModal?.();
        return;
      }

      // 3. 'Space' or 'K' (Play / Pause toggle)
      if (event.code === "Space" || event.key === " " || event.key === "k" || event.key === "K") {
        event.preventDefault();
        onTogglePlay?.();
        return;
      }

      // 4. 'Left Arrow' (Seek 5 seconds backward)
      if (event.code === "ArrowLeft" || event.key === "ArrowLeft") {
        event.preventDefault();
        if (onSeekRelative) {
          onSeekRelative(-5);
        } else if (onSeekBackward) {
          onSeekBackward(5);
        }
        return;
      }

      // 5. 'Right Arrow' (Seek 5 seconds forward)
      if (event.code === "ArrowRight" || event.key === "ArrowRight") {
        event.preventDefault();
        if (onSeekRelative) {
          onSeekRelative(5);
        } else if (onSeekForward) {
          onSeekForward(5);
        }
        return;
      }

      // 6. 'J' (Seek 10 seconds backward)
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        if (onSeekRelative) {
          onSeekRelative(-10);
        }
        return;
      }

      // 7. 'L' (Seek 10 seconds forward)
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (onSeekRelative) {
          onSeekRelative(10);
        }
        return;
      }

      // 8. 'C' (Toggle Subtitles)
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        onToggleSubtitles?.();
        return;
      }

      // 9. 'M' (Toggle Mute)
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        onToggleMute?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    onTogglePlay,
    onSeekBackward,
    onSeekForward,
    onSeekRelative,
    onSaveEdits,
    onToggleShortcutsModal,
    onToggleSubtitles,
    onToggleMute,
  ]);
}
