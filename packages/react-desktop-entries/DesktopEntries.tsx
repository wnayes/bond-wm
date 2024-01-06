import React, { useCallback, useState } from "react";
import { useDesktopEntries, useElementSize } from "@bond-wm/react";
import { DesktopEntry as DesktopEntryType } from "@bond-wm/shared";
import { executeDesktopEntry } from "@bond-wm/shared-renderer";
import "./DesktopEntries.css";

const DesktopEntryHeight = 110;
const DesktopEntryWidth = 80;

interface IDesktopEntriesProps {
  flowDirection?: "row" | "column";
}

/** Displays desktop icons in a grid. */
export function DesktopEntries({ flowDirection }: IDesktopEntriesProps) {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const onDesktopBackgroundClick = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  const onEntryActivated = useCallback((entry: DesktopEntryType) => {
    setSelectedEntry(null);
    executeDesktopEntry(entry.key);
  }, []);

  const entries = useDesktopEntries();
  const entryElements = [];
  for (const entryName in entries) {
    const entry = entries[entryName];
    entryElements.push(
      <DesktopEntryComponent
        key={entryName}
        entry={entry}
        selected={entryName === selectedEntry}
        onClick={() => setSelectedEntry(entryName)}
        onActivate={onEntryActivated}
      />
    );
  }

  const [containerSize, containerSizeRef] = useElementSize();
  let [columnCount, rowCount] = [0, 0];
  if (containerSize) {
    columnCount = Math.floor(containerSize.width / DesktopEntryWidth);
    rowCount = Math.floor(containerSize.height / DesktopEntryHeight);
  }

  const entriesMax = columnCount * rowCount;
  while (entryElements.length > entriesMax) {
    entryElements.pop();
  }

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${columnCount}, ${DesktopEntryWidth}px)`,
    gridTemplateRows: `repeat(${rowCount}, ${DesktopEntryHeight}px)`,
    gridAutoFlow: flowDirection ?? "column",
  };

  return (
    <>
      <div
        ref={containerSizeRef}
        className="desktopEntriesContainer"
        style={gridStyle}
        onClick={onDesktopBackgroundClick}
      >
        {entryElements}
      </div>
    </>
  );
}

interface IDesktopEntryComponentProps {
  entry: DesktopEntryType;
  selected?: boolean;
  onClick(): void;
  onActivate(entry: DesktopEntryType): void;
}

function DesktopEntryComponent({ entry, selected, onClick, onActivate }: IDesktopEntryComponentProps) {
  let className = "desktopEntry";
  if (selected) {
    className += " selected";
  }

  const onClickWrapper = useCallback<React.MouseEventHandler>(
    (e) => {
      e.stopPropagation();
      onClick();
    },
    [onClick]
  );

  const onDoubleClickWrapper = useCallback<React.MouseEventHandler>(
    (e) => {
      e.stopPropagation();
      onActivate(entry);
    },
    [entry, onActivate]
  );

  return (
    <div className={className} onClick={onClickWrapper} onDoubleClick={onDoubleClickWrapper}>
      {entry.icon && <img src={entry.icon} height={48} width={48} className="desktopIcon" />}
      <div className="desktopEntryText">{entry.name}</div>
    </div>
  );
}
