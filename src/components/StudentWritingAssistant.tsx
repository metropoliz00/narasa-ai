import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Check,
  RotateCcw,
  X,
  Smile,
  CheckCircle2,
  ThumbsUp,
  Loader2,
  HelpCircle,
  PenTool
} from 'lucide-react';
import { AIClientService } from '../services/aiClientService';

interface StudentWritingAssistantProps {
  currentAnswer: string;
  stageId: string;
  stageTitle: string;
  question: string;
  objectName?: string;
  material?: string;
  onApplyRefinedAnswer: (refinedText: string) => void;
}

export const StudentWritingAssistant: React.FC<StudentWritingAssistantProps> = ({
  currentAnswer,
  stageId,
  stageTitle,
  question,
  objectName,
  material,
  onApplyRefinedAnswer
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [refinedResult, setRefinedResult] = useState<{
    refinedAnswer: string;
    explanation: string;
    improvements: string[];
  } | null>(null);
  const [previousOriginal, setPreviousOriginal] = useState<string | null>(null);
  const [hasAppliedRefined, setHasAppliedRefined] = useState(false);

  const trimmedLength = currentAnswer.trim().length;
  const isEligible = trimmedLength >= 5;

  const handleRequestRefine = async () => {
    if (!isEligible || isLoading) return;

    setIsLoading(true);
    setShowRecommendation(false);

    try {
      const result = await AIClientService.refineStudentAnswer({
        rawAnswer: currentAnswer,
        stageId,
        stageTitle,
        question,
        objectName,
        material
      });

      setRefinedResult(result);
      setShowRecommendation(true);
    } catch (err) {
      console.error('Failed to refine answer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!refinedResult) return;
    setPreviousOriginal(currentAnswer);
    onApplyRefinedAnswer(refinedResult.refinedAnswer);
    setHasAppliedRefined(true);
    setShowRecommendation(false);
  };

  const handleUndo = () => {
    if (previousOriginal !== null) {
      onApplyRefinedAnswer(previousOriginal);
      setHasAppliedRefined(false);
      setPreviousOriginal(null);
    }
  };

  return (
    <div className="space-y-2.5 pt-1">
      {/* Action / Trigger Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRequestRefine}
            disabled={!isEligible || isLoading}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-2xs ${
              !isEligible
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : isLoading
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-wait opacity-90'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-md hover:shadow-indigo-500/20 active:scale-98 cursor-pointer'
            }`}
            title={
              !isEligible
                ? 'Tuliskan ide jawabanmu terlebih dahulu agar bisa dirapikan'
                : 'Rapikan ejaan, tanda baca, dan alur kalimat tanpa mengubah maksud pemikiranmu'
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Sahabat Tulis AI sedang membaca... ✨</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-yellow-300 animate-pulse shrink-0" />
                <span>✨ Bantu Rapikan Tulisan (Asisten AI)</span>
              </>
            )}
          </button>

          {hasAppliedRefined && previousOriginal && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Kembalikan ke kata-kata tulisan asli sebelumnya"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>↩️ Kembalikan Tulisan Awal</span>
            </button>
          )}
        </div>

        {/* Dynamic Helper Note */}
        {!isEligible ? (
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Tuliskan idemu dulu ya, nanti Asisten AI bantu rapikan ejaannya!
          </span>
        ) : !hasAppliedRefined ? (
          <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            🔒 Maksud & ide aslimu 100% tetap terjaga
          </span>
        ) : (
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Tulisan sudah dirapikan ✨
          </span>
        )}
      </div>

      {/* AI Refinement Proposal Card */}
      {showRecommendation && refinedResult && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/95 via-purple-50/80 to-blue-50/95 border-2 border-indigo-300 shadow-md space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-indigo-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-2xs shrink-0">
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <h5 className="font-extrabold text-xs sm:text-sm text-indigo-950 flex items-center gap-1.5">
                  <span>Saran Tulisan Lebih Rapi dari Sahabat Tulis AI</span>
                </h5>
                <p className="text-[11px] text-indigo-700 font-medium">
                  Hanya merapikan ejaan dan tata kalimat — ide pemikiranmu tetap murni milikmu!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRecommendation(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition cursor-pointer"
              title="Tutup Saran"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Refined Text Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
              <span>Hasil Tulisan yang Disarankan:</span>
              <span className="text-emerald-700 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Lebih rapi dibaca
              </span>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-white border-2 border-indigo-200 text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed shadow-2xs selection:bg-indigo-100">
              “{refinedResult.refinedAnswer}”
            </div>
          </div>

          {/* Assistant Note / Explanation */}
          {refinedResult.explanation && (
            <div className="p-3 rounded-xl bg-white/80 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-950 leading-relaxed shadow-2xs">
              <span className="text-base shrink-0">💬</span>
              <div>
                <span className="font-bold block text-[11px] text-indigo-900 uppercase">
                  Catatan Sahabat Tulis:
                </span>
                <p className="font-medium text-slate-700">{refinedResult.explanation}</p>
              </div>
            </div>
          )}

          {/* Improvements tags */}
          {refinedResult.improvements && refinedResult.improvements.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 mr-1">Bagian yang dirapikan:</span>
              {refinedResult.improvements.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-800 text-[10px] font-bold shadow-2xs"
                >
                  ✨ {item}
                </span>
              ))}
            </div>
          )}

          {/* Actions: Apply or Keep Original */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-indigo-200/80">
            <button
              type="button"
              onClick={() => setShowRecommendation(false)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              Tetap Pakai Tulisan Asliku
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Gunakan Tulisan Rapi Ini ✨</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
