import * as React from "react";

import { useDispatch, useSelector } from "react-redux";
import { useMemo } from "react";
import { RootState } from "../../../renderer-shared/configureStore";
import { selectWindowsFromScreen } from "../../../shared/selectors";
import { setScreenCurrentTagsAction } from "../../../shared/redux/screenSlice";

interface ITagListProps {
  screenIndex: number;
}

export function TagList(props: ITagListProps) {
  const tags = useSelector<RootState>((state) => state.screens[props.screenIndex].tags) as string[];
  const currentTags = useSelector<RootState>((state) => state.screens[props.screenIndex].currentTags) as string[];

  const windows = useSelector((state: RootState) => selectWindowsFromScreen(state, props.screenIndex));
  const tagWindowMap = useMemo(() => {
    const map: { [tag: string]: { urgent: boolean } } = {};
    for (const win of windows) {
      for (const tag of win.tags) {
        if (!map[tag]) {
          map[tag] = { urgent: win.urgent };
        } else if (!map[tag].urgent && win.urgent) {
          map[tag].urgent = true;
        }
      }
    }
    return map;
  }, [windows]);

  const dispatch = useDispatch();

  const entries = tags.map((tag) => {
    return (
      <TagListEntry
        tag={tag}
        key={tag}
        selected={currentTags.indexOf(tag) >= 0}
        populated={!!tagWindowMap[tag]}
        urgent={tagWindowMap[tag]?.urgent ?? false}
        onClick={() => {
          dispatch(setScreenCurrentTagsAction({ screenIndex: props.screenIndex, currentTags: [tag] }));
        }}
      />
    );
  });

  return <div className="taglist">{entries}</div>;
}

interface ITagListEntryProps {
  tag: string;
  selected: boolean;
  populated: boolean;
  urgent: boolean;
  onClick?: VoidFunction | undefined;
}

function TagListEntry({ tag, selected, populated, urgent, onClick }: ITagListEntryProps) {
  let className = "taglistentry";
  if (selected) {
    className += " selected";
    onClick = undefined;
  }
  if (urgent) {
    className += " urgent";
  }

  return (
    <div className={className} onClick={onClick}>
      {populated && <div className="taglistEntryBadge"></div>}
      {tag}
    </div>
  );
}
