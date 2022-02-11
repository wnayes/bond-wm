import * as React from "react";
import { useDispatch } from "react-redux";
import { exec, getCompletionOptions } from "../../../renderer-shared/commands";
import { useEffect, useRef, useState } from "react";
import { showRunFieldAction } from "../../../renderer-shared/redux/taskbarSlice";

export function RunField() {
  const field = useRef<HTMLInputElement>();

  const [text, setText] = useState("");
  const freezeTyping = useRef<boolean>(false);
  const enterWhileFrozen = useRef<boolean>(false);

  const dispatch = useDispatch();

  const reset = () => {
    setText("");
    dispatch(showRunFieldAction(false));
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
          exec(text);
          reset();
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
              exec(bestOption);
              reset();
            }
          }
          freezeTyping.current = false;
          enterWhileFrozen.current = false;
        });
        break;
    }
  };

  const onBlur = () => {
    reset();
  };

  useEffect(() => {
    field.current?.focus();
  }, []);

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
