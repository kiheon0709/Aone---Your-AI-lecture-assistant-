"use client";

import { useState, use, useEffect } from "react";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SummaryTabs from "@/components/document/SummaryTabs";
import { fetchFiles, getFileUrl, deleteFile, FileMetadata } from "@/lib/files";
import { getCurrentUser } from "@/lib/auth";
import AuthGuard from "@/components/auth/AuthGuard";

// PDFViewer를 Dynamic Import로 로드 (브라우저에서만 실행)
const PDFViewer = dynamic(
  () => import("@/components/document/PDFViewer"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">PDF 뷰어 로딩 중...</p>
        </div>
      </div>
    )
  }
);

function DocumentContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1);
  const resolvedParams = use(params);
  const [fileData, setFileData] = useState<FileMetadata | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);

  useEffect(() => {
    loadDocument();
  }, [resolvedParams.id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        setError("로그인이 필요합니다.");
        return;
      }

      // 파일 메타데이터 조회
      const files = await fetchFiles(user.id);
      const file = files.find(f => f.id === resolvedParams.id);

      if (!file) {
        setError("문서를 찾을 수 없습니다.");
        return;
      }

      setFileData(file);

      // PDF 파일인 경우 Storage URL 가져오기
      if (file.type === 'pdf') {
        const url = await getFileUrl(file.storage_path);
        setPdfUrl(url);
      }
    } catch (err: any) {
      console.error("문서 로드 실패:", err);
      setError(err.message || "문서를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!fileData) return;
    
    if (!confirm(`"${fileData.name}" 파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteFile(fileData.id);
      router.push("/dashboard");
    } catch (err: any) {
      alert("파일 삭제에 실패했습니다: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">문서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "문서를 찾을 수 없습니다."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 빈 요약 데이터로 시작 (TipTap JSON 형식)
  const emptyTipTapContent = {
    type: 'doc',
    content: [],
  };

  // PDF에서 읽은 페이지 수를 우선 사용, 없으면 DB의 page_count, 그것도 없으면 1
  const pageCount = pdfPageCount || fileData.page_count || 1;

  const documentData = {
    id: fileData.id,
    name: fileData.name,
    pdfUrl: pdfUrl,
    totalSlides: pageCount,
    slideSummaries: Array.from({ length: pageCount }, (_, i) => ({
      slideNumber: i + 1,
      title: `Slide ${i + 1}`,
      summaryContent: null, // 빈 상태로 시작
      userNotesContent: null, // 빈 상태로 시작
      audioSegments: [],
    })),
    fullSummary: null,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <FileText className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-semibold text-gray-800">{documentData.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {fileData.type === 'pdf' ? `Slide ${currentSlide} / ${documentData.totalSlides}` : '오디오 파일'}
          </span>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            title="파일 삭제"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {fileData.type === 'pdf' ? (
          <>
            {/* 좌측: PDF 뷰어 */}
            <div className="w-1/2 bg-white border-r border-gray-200">
              {pdfUrl ? (
                <PDFViewer
                  pdfUrl={pdfUrl}
                  currentSlide={currentSlide}
                  totalSlides={documentData.totalSlides}
                  onSlideChange={setCurrentSlide}
                  onPdfLoad={setPdfPageCount}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">PDF URL을 생성하는 중...</p>
                  </div>
                </div>
              )}
            </div>

            {/* 우측: 요약 탭 */}
            <div className="w-1/2 bg-white">
              <SummaryTabs
                documentId={documentData.id}
                slideSummaries={documentData.slideSummaries}
                fullSummary={documentData.fullSummary}
                currentSlide={currentSlide}
                onSlideChange={setCurrentSlide}
              />
            </div>
          </>
        ) : (
          /* 오디오 파일인 경우 */
          <div className="w-full bg-white flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">오디오 파일 재생 기능은 준비 중입니다.</p>
              <p className="text-sm text-gray-500">파일명: {fileData.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard>
      <DocumentContent params={params} />
    </AuthGuard>
  );
}

