import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo } from "react";
import { RootState } from "@electron-wm/renderer-shared";
import { selectWindowsFromScreen } from "@electron-wm/shared";
import { setScreenCurrentTagsAction } from "@electron-wm/shared";
import { arraysEqual, isUrgent } from "@electron-wm/shared";
import { useScreenIndex } from "@electron-wm/plugin-utils";

export function TagList() {
  const screenIndex = useScreenIndex();
  const tags = useSelector<RootState>((state) => state.screens[screenIndex].tags) as string[];
  const currentTags = useSelector<RootState>((state) => state.screens[screenIndex].currentTags) as string[];

  const windows = useSelector((state: RootState) => selectWindowsFromScreen(state, screenIndex));
  const tagWindowMap = useMemo(() => {
    const map: { [tag: string]: { urgent: boolean } } = {};
    for (const win of windows) {
      for (const tag of win.tags) {
        if (!map[tag]) {
          map[tag] = { urgent: isUrgent(win) };
        } else if (!map[tag].urgent && isUrgent(win)) {
          map[tag].urgent = true;
        }
      }
    }
    return map;
  }, [windows]);

  const dispatch = useDispatch();

  const onTagClick = useCallback<TagListEntryOnClick>(
    (event, tag, selected) => {
      let nextTags: string[] | undefined;
      if (event.ctrlKey) {
        if (selected) {
          // Ctrl click a showing tag removes it.
          const reducedTags = currentTags.filter((t) => t !== tag);
          if (reducedTags.length > 0) {
            nextTags = reducedTags;
          }
        } else {
          // Ctrl click another tag adds it.
          nextTags = [tag, ...currentTags];
        }
      } else {
        nextTags = [tag];
      }

      if (nextTags && !arraysEqual(currentTags, nextTags)) {
        dispatch(setScreenCurrentTagsAction({ screenIndex, currentTags: nextTags }));
      }
    },
    [currentTags, screenIndex, dispatch]
  );

  const entries = tags.map((tag) => {
    return (
      <TagListEntry
        tag={tag}
        key={tag}
        selected={currentTags.indexOf(tag) >= 0}
        populated={!!tagWindowMap[tag]}
        urgent={tagWindowMap[tag]?.urgent ?? false}
        onClick={onTagClick}
      />
    );
  });

  return <div className="taglist">{entries}</div>;
}

type TagListEntryOnClick = (event: MouseEvent, tag: string, selected: boolean) => void;

interface ITagListEntryProps {
  tag: string;
  selected: boolean;
  populated: boolean;
  urgent: boolean;
  onClick?: TagListEntryOnClick | undefined;
}

function TagListEntry({ tag, selected, populated, urgent, onClick }: ITagListEntryProps) {
  let className = "taglistentry";
  if (selected) {
    className += " selected";
  }
  if (urgent) {
    className += " urgent";
  }

  const clickHandler = useCallback<React.MouseEventHandler>(
    (event) => {
      onClick?.(event.nativeEvent, tag, selected);
    },
    [onClick, tag, selected]
  );

  return (
    <div className={className} onClick={clickHandler}>
      {populated && <div className="taglistEntryBadge"></div>}
      {tag}
    </div>
  );
}
