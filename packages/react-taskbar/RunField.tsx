import React, { useEffect, useRef, useState } from "react";
import { exec, getCompletionOptions } from "@electron-wm/shared-renderer";
import { useDesktopShortcut } from "@electron-wm/react";

let lastEntryText: string | undefined;

export function RunField() {
  const [showingRun, setShowingRun] = useState(false);

  const field = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const freezeTyping = useRef<boolean>(false);
  const enterWhileFrozen = useRef<boolean>(false);

  useDesktopShortcut("Mod4 + r", { desktopTakesFocus: true }, () => {
    setShowingRun(true);
  });

  const reset = () => {
    setText("");
    setShowingRun(false);
  };

  const submit = (submitText: string) => {
    lastEntryText = submitText;
    exec(submitText);
    reset();
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (freezeTyping.current) {
      return;
    }
    setText(event.target.value);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    switch (event.key) {
      case "Enter":
        event.preventDefault();
        event.stopPropagation();

        if (freezeTyping.current) {
          enterWhileFrozen.current = true;
        } else if (text) {
          submit(text);
        }
        break;

      case "Escape":
        event.preventDefault();
        event.stopPropagation();

        reset();
        break;

      case "Tab":
        event.preventDefault();
        event.stopPropagation();

        if (freezeTyping.current) {
          break;
        }
        freezeTyping.current = true;
        getCompletionOptions().then((options) => {
          const bestOption = selectOption(options, text);
          if (bestOption) {
            setText(bestOption);
            if (enterWhileFrozen.current) {
              submit(bestOption);
            }
          }
          freezeTyping.current = false;
          enterWhileFrozen.current = false;
        });
        break;

      // Set value to the prior submitted value, if any.
      case "=":
        if (text === "") {
          event.preventDefault();
          setText(lastEntryText || "");
        }
        break;
    }
  };

  const onBlur = () => {
    reset();
  };

  useEffect(() => {
    if (showingRun) {
      field.current?.focus();
    }
  }, [showingRun]);

  if (!showingRun) {
    return null;
  }

  return (
    <input
      type="text"
      value={text}
      className="taskbarRunField"
      ref={field}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );
}

function selectOption(options: string[], text: string): string | undefined {
  for (const option of options) {
    if (option.startsWith(text)) {
      return option;
    }
  }
  return undefined;
}
