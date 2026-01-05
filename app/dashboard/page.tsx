"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Plus, Upload, FolderPlus, File, Trash2 } from "lucide-react";
import { useFolders, FolderNode } from "@/contexts/FolderContext";
import CreateFolderModal from "@/components/modals/CreateFolderModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { uploadFile, fetchFiles, deleteFile, FileMetadata } from "@/lib/files";
import { getCurrentUser } from "@/lib/auth";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { folders, loading, error, findItemById, createFolder, refreshFolders } = useFolders();
  const [selectedItem, setSelectedItem] = useState<FolderNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // URL 파라미터에서 폴더 ID를 읽어서 선택
  useEffect(() => {
    const folderId = searchParams.get('folder');
    if (folderId && !loading && folders.length > 0) {
      const folder = findItemById(folderId);
      if (folder && folder.type === 'folder') {
        setSelectedItem(folder);
      }
    } else if (!folderId) {
      // 쿼리 파라미터가 없으면 선택 해제
      setSelectedItem(null);
    }
  }, [searchParams, loading, folders, findItemById]);

  // 선택된 폴더의 파일 목록 로드 (루트 폴더 포함)
  useEffect(() => {
    const loadFiles = async () => {
      // selectedItem이 null이면 루트 폴더(null)의 파일을 로드
      // selectedItem이 있고 folder 타입이면 해당 폴더의 파일을 로드
      if (selectedItem && selectedItem.type !== 'folder') {
        setFiles([]);
        return;
      }

      try {
        setFilesLoading(true);
        const user = await getCurrentUser();
        if (!user) return;
        
        const folderId = selectedItem?.id || null;
        const folderFiles = await fetchFiles(user.id, folderId);
        setFiles(folderFiles);
      } catch (err: any) {
        console.error("파일 목록 로드 실패:", err);
      } finally {
        setFilesLoading(false);
      }
    };

    loadFiles();
  }, [selectedItem]);

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name, selectedItem?.id || null);
      setShowCreateModal(false);
      // 사이드바 새로고침
      await refreshFolders();
    } catch (err: any) {
      console.error("폴더 생성 실패:", err);
      alert("폴더 생성에 실패했습니다: " + err.message);
    }
  };

  const handleFileUpload = async () => {
    // 파일 업로드 기능 (PDF/오디오 파일)
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.mp3,.wav,.m4a,.mp4";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // 파일 업로드
        const fileMetadata = await uploadFile(file, selectedItem?.id || null);
        
        // 사이드바 새로고침 (파일이 사이드바에 즉시 표시됨)
        await refreshFolders();
        
        // 파일 목록도 새로고침
        const user = await getCurrentUser();
        if (user) {
          const folderId = selectedItem?.id || null;
          const folderFiles = await fetchFiles(user.id, folderId);
          setFiles(folderFiles);
        }
        
        // 업로드 성공 시 문서 상세 페이지로 이동
        router.push(`/document/${fileMetadata.id}`);
      } catch (err: any) {
        console.error("파일 업로드 실패:", err);
        alert("파일 업로드에 실패했습니다: " + err.message);
      }
    };
    input.click();
  };

  const handleSelectItem = (item: FolderNode) => {
    if (item.type === "document") {
      // 문서 클릭 시 상세 페이지로 이동
      router.push(`/document/${item.id}`);
    } else {
      // 폴더 클릭 시 URL 업데이트하고 선택
      router.push(`/dashboard?folder=${item.id}`);
      setSelectedItem(item);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onSelectItem={handleSelectItem}
        selectedItemId={selectedItem?.id}
      />

      <div className="flex-1 flex flex-col">
        <Header title="문서" />

        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">폴더를 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : !selectedItem ? (
            <div>
              {/* 루트 폴더 (selectedItem이 null일 때) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">전체 문서</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleFileUpload}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <Upload className="w-4 h-4 text-white" />
                      파일 업로드
                    </button>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-800"
                    >
                      <Plus className="w-4 h-4 text-gray-800" />
                      새 폴더
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">
                  {files.length}개의 파일
                </p>
              </div>

              {/* 루트 폴더의 파일 목록 */}
              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group relative"
                    >
                      <div
                        onClick={() => router.push(`/document/${file.id}`)}
                        className="flex items-start gap-4 cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          {file.type === "pdf" ? (
                            <File className="w-6 h-6 text-red-500" />
                          ) : (
                            <File className="w-6 h-6 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-semibold text-gray-800 mb-1 truncate">
                            {file.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {file.type === "pdf" ? "PDF 문서" : "오디오 파일"}
                            {file.size && ` • ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`"${file.name}" 파일을 삭제하시겠습니까?`)) {
                            try {
                              await deleteFile(file.id);
                              // 사이드바 새로고침 (파일이 사이드바에서 즉시 사라짐)
                              await refreshFolders();
                              // 파일 목록도 새로고침
                              const user = await getCurrentUser();
                              if (user) {
                                const folderFiles = await fetchFiles(user.id, null);
                                setFiles(folderFiles);
                              }
                            } catch (err: any) {
                              alert("파일 삭제에 실패했습니다: " + err.message);
                            }
                          }
                        }}
                        className="absolute top-4 right-4 p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 opacity-0 group-hover:opacity-100"
                        title="파일 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <p className="text-gray-500 mb-4">업로드된 파일이 없습니다</p>
                  <button 
                    onClick={handleFileUpload}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors mx-auto"
                  >
                    <Upload className="w-4 h-4" />
                    파일 업로드
                  </button>
                </div>
              )}

              {filesLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              )}
            </div>
          ) : selectedItem.type === "folder" ? (
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedItem.name}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleFileUpload}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <Upload className="w-4 h-4 text-white" />
                      파일 업로드
                    </button>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-800"
                    >
                      <Plus className="w-4 h-4 text-gray-800" />
                      하위 폴더
                    </button>
                  </div>
                </div>
                {(() => {
                  const childFolders = selectedItem.children?.filter(child => child.type === 'folder') || [];
                  const totalItems = childFolders.length + files.length;
                  return (
                    <p className="text-gray-600">
                      {totalItems}개의 항목
                      {(childFolders.length > 0 || files.length > 0) && ' ('}
                      {childFolders.length > 0 && `폴더 ${childFolders.length}개`}
                      {childFolders.length > 0 && files.length > 0 && ', '}
                      {files.length > 0 && `파일 ${files.length}개`}
                      {(childFolders.length > 0 || files.length > 0) && ')'}
                    </p>
                  );
                })()}
              </div>

              {/* 하위 폴더 및 파일 목록 */}
              {(selectedItem.children && selectedItem.children.length > 0) || files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 하위 폴더 */}
                  {selectedItem.children && selectedItem.children.length > 0 && (
                    <>
                      {[...selectedItem.children]
                        .filter(child => child.type === "folder")
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((child: any) => (
                        <div
                          key={child.id}
                          onClick={() => router.push(`/dashboard?folder=${child.id}`)}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                              <FolderPlus className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h3 className="font-semibold text-gray-800 mb-1 truncate">
                                {child.name}
                              </h3>
                              <p className="text-sm text-gray-500">폴더</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* 업로드된 파일 */}
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group relative"
                    >
                      <div
                        onClick={() => router.push(`/document/${file.id}`)}
                        className="flex items-start gap-4 cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          {file.type === "pdf" ? (
                            <File className="w-6 h-6 text-red-500" />
                          ) : (
                            <File className="w-6 h-6 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-semibold text-gray-800 mb-1 truncate">
                            {file.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {file.type === "pdf" ? "PDF 문서" : "오디오 파일"}
                            {file.size && ` • ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`"${file.name}" 파일을 삭제하시겠습니까?`)) {
                            try {
                              await deleteFile(file.id);
                              // 사이드바 새로고침 (파일이 사이드바에서 즉시 사라짐)
                              await refreshFolders();
                              // 파일 목록도 새로고침
                              const user = await getCurrentUser();
                              if (user) {
                                const folderFiles = await fetchFiles(user.id, selectedItem?.id || null);
                                setFiles(folderFiles);
                              }
                            } catch (err: any) {
                              alert("파일 삭제에 실패했습니다: " + err.message);
                            }
                          }
                        }}
                        className="absolute top-4 right-4 p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 opacity-0 group-hover:opacity-100"
                        title="파일 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">폴더가 비어있습니다</p>
                </div>
              )}
              
              {filesLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedItem.name}</h2>
              <p className="text-gray-600">문서 상세 화면은 다음 단계에서 구현됩니다.</p>
            </div>
          )}
        </main>
      </div>

      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFolder}
        parentId={selectedItem?.id}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

