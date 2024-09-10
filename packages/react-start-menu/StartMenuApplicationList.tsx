import React, { useCallback, useMemo, useState } from "react";
import { useDesktopEntries } from "@bond-wm/react";
import { DesktopEntry } from "@bond-wm/shared";
import { executeDesktopEntry, makeDesktopEntryIconUrl } from "@bond-wm/shared-renderer";
import { useStartMenuContext } from "./StartMenuContext";
import { defaultCategories } from "./categoryMappings";
import "./StartMenuStyles.css";

interface IStartMenuApplicationListProps {
  groupBy?: "categories" | "all";
}

export function StartMenuApplicationList({ groupBy = "categories" }: IStartMenuApplicationListProps) {
  const [currentGroupBy, setCurrentGroupBy] = useState(groupBy);
  const smContext = useStartMenuContext();

  const onEntryActivated = useCallback(
    (entry: DesktopEntry) => {
      smContext?.close();
      executeDesktopEntry(entry.key);
    },
    [smContext]
  );

  const toggleGroupBy = () => {
    setCurrentGroupBy((prevGroupBy) => (prevGroupBy === "categories" ? "all" : "categories"));
  };

  const entries = useDesktopEntries();
  const categorizedEntries = useMemo(() => {
    if (currentGroupBy === "all") {
      return { All: Object.values(entries) };
    }

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
  }, [entries, currentGroupBy]);

  return (
    <div className="startMenuAppList">
      <div className="listHeader">
        <div className="toggleButton" onClick={toggleGroupBy}>
          Group by <span>{currentGroupBy === "categories" ? "All" : "Categories"}</span>
        </div>
      </div>
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
