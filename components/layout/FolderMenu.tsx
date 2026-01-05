"use client";

import { useState, useRef, useEffect } from "react";
import { Edit2, Trash2, FolderPlus, FilePlus } from "lucide-react";

interface FolderMenuProps {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function FolderMenu({
  item,
  onEdit,
  onDelete,
  onCreateFolder,
  onCreateDocument,
  position,
  onClose,
}: FolderMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[180px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {item.type === "folder" && (
        <>
          <button
            onClick={() => {
              onCreateFolder();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left text-sm text-gray-800"
          >
            <FolderPlus className="w-4 h-4 text-gray-600" />
            하위 폴더 만들기
          </button>
          <button
            onClick={() => {
              onCreateDocument();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left text-sm text-gray-800"
          >
            <FilePlus className="w-4 h-4 text-gray-600" />
            문서 추가
          </button>
          <div className="border-t border-gray-200 my-1"></div>
        </>
      )}
      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left text-sm text-gray-800"
      >
        <Edit2 className="w-4 h-4 text-gray-600" />
        이름 변경
      </button>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left text-sm text-red-600"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
        삭제
      </button>
    </div>
  );
}

