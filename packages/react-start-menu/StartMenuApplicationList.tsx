import React, { useCallback, useMemo } from "react";
import { useDesktopEntries } from "@bond-wm/react";
import { DesktopEntry } from "@bond-wm/shared";
import { executeDesktopEntry, makeDesktopEntryIconUrl } from "@bond-wm/shared-renderer";
import { useStartMenuContext } from "./StartMenuContext";

export function StartMenuApplicationList() {
  const smContext = useStartMenuContext();

  const onEntryActivated = useCallback(
    (entry: DesktopEntry) => {
      smContext?.close();
      executeDesktopEntry(entry.key);
    },
    [smContext]
  );

  const entries = useDesktopEntries();
  const entryComponents = useMemo(() => {
    return Object.values(entries)
      .sort((a, b) => {
        // Sort by case-insensitive name.
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      })
      .map((entry) => <StartMenuApplicationEntry key={entry.key} entry={entry} onClick={onEntryActivated} />);
  }, [entries, onEntryActivated]);

  return <div className="startMenuAppList">{entryComponents}</div>;
}

interface IStartMenuApplicationEntryProps {
  entry: DesktopEntry;
  onClick: (entry: DesktopEntry) => void;
}

export function StartMenuApplicationEntry({ entry, onClick }: IStartMenuApplicationEntryProps) {
  return (
    <div className="startMenuAppEntry" onClick={() => onClick(entry)}>
      {entry.icon && (
        <img src={makeDesktopEntryIconUrl(entry.key)} height={16} width={16} className="startMenuAppEntryIcon" />
      )}
      {!entry.icon && <div className="startMenuAppEntryIcon" />} {entry.name}
    </div>
  );
}
