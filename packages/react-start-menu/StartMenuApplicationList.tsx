import React, { useCallback, useMemo } from "react";
import { useDesktopEntries } from "@bond-wm/react";
import { DesktopEntry } from "@bond-wm/shared";
import { executeDesktopEntry, makeDesktopEntryIconUrl } from "@bond-wm/shared-renderer";
import { useStartMenuContext } from "./StartMenuContext";
import { defaultCategories } from "./categoryMappings";

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
  const categorizedEntries = useMemo(() => {
    const categories: Record<string, DesktopEntry[]> = {};
    Object.values(entries).forEach((entry) => {
      entry.categories?.forEach((category) => {
        const humanReadableCategory = defaultCategories[category] || category;
        if (!categories[humanReadableCategory]) {
          categories[humanReadableCategory] = [];
        }
        categories[humanReadableCategory].push(entry);
      });
    });
    return categories;
  }, [entries]);

  return (
    <div className="startMenuAppList">
      {Object.entries(categorizedEntries).map(([category, entries]) => (
        <div key={category}>
          <h3>{category}</h3>
          {entries
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => (
              <StartMenuApplicationEntry key={entry.key} entry={entry} onClick={onEntryActivated} />
            ))}
        </div>
      ))}
    </div>
  );
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
