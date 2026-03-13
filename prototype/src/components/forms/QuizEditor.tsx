'use client';

import { useState } from 'react';
import type { Quiz, QuizChoice } from '@/lib/types';

const LANG_TABS = [
  { key: 'ko' as const, label: 'KO' },
  { key: 'en' as const, label: 'EN' },
  { key: 'jp' as const, label: 'JP' },
];

interface QuizEditorProps {
  quizzes: Quiz[];
  onChange: (quizzes: Quiz[]) => void;
  disabled?: boolean;
  onAdd?: () => void;
  onDelete?: (index: number) => void;
}

export default function QuizEditor({ quizzes, onChange, disabled = false, onAdd, onDelete }: QuizEditorProps) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'jp'>('ko');
  const [expandedQuiz, setExpandedQuiz] = useState<number>(0);

  const updateQuiz = (index: number, updates: Partial<Quiz>) => {
    if (disabled) return;
    const newQuizzes = quizzes.map((q, i) => (i === index ? { ...q, ...updates } : q));
    onChange(newQuizzes);
  };

  const updateQuizText = (index: number, lang: 'ko' | 'en' | 'jp', value: string) => {
    const quiz = quizzes[index];
    updateQuiz(index, { text: { ...quiz.text, [lang]: value } });
  };

  const updateChoice = (quizIndex: number, choiceIndex: number, lang: 'ko' | 'en' | 'jp', value: string) => {
    const quiz = quizzes[quizIndex];
    const newChoices = [...quiz.choices] as [QuizChoice, QuizChoice, QuizChoice, QuizChoice];
    newChoices[choiceIndex] = { ...newChoices[choiceIndex], [lang]: value };
    updateQuiz(quizIndex, { choices: newChoices });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">퀴즈 목록 ({quizzes.length}/10문제)</h3>
        <div className="flex gap-1">
          {LANG_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveLang(tab.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeLang === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {disabled && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">Active 상태에서는 퀴즈를 수정할 수 없습니다.</p>
        </div>
      )}

      <div className="space-y-3">
        {quizzes.map((quiz, qi) => (
          <div key={quiz.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className={`flex items-center justify-between px-4 py-3 ${
              expandedQuiz === qi ? 'bg-purple-50 border-b border-gray-200' : 'bg-white hover:bg-gray-50'
            }`}>
              <button
                type="button"
                onClick={() => setExpandedQuiz(expandedQuiz === qi ? -1 : qi)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  Q{quiz.questionNumber}
                </span>
                <span className="text-sm text-gray-700 truncate max-w-[400px]">
                  {quiz.text[activeLang] || '(미입력)'}
                </span>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(qi)}
                    disabled={quizzes.length <= 1}
                    className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed px-2 py-1"
                  >
                    삭제
                  </button>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedQuiz === qi ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  onClick={() => setExpandedQuiz(expandedQuiz === qi ? -1 : qi)}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {expandedQuiz === qi && (
              <div className="px-4 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    문제 ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={quiz.text[activeLang]}
                    onChange={(e) => updateQuizText(qi, activeLang, e.target.value)}
                    disabled={disabled}
                    placeholder="문제를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    선택지 ({activeLang.toUpperCase()})
                  </label>
                  <div className="space-y-2">
                    {quiz.choices.map((choice, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => !disabled && updateQuiz(qi, { correctIndex: ci })}
                          disabled={disabled}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            quiz.correctIndex === ci
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {quiz.correctIndex === ci && (
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                        <input
                          type="text"
                          value={choice[activeLang]}
                          onChange={(e) => updateChoice(qi, ci, activeLang, e.target.value)}
                          disabled={disabled}
                          placeholder={`선택지 ${ci + 1}`}
                          className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                            quiz.correctIndex === ci ? 'border-green-300 bg-green-50' : 'border-gray-200'
                          }`}
                        />
                        {quiz.correctIndex === ci && (
                          <span className="text-xs text-green-600 font-medium flex-shrink-0">정답</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">제한시간:</label>
                  <input
                    type="number"
                    value={quiz.timeLimit}
                    onChange={(e) =>
                      updateQuiz(qi, { timeLimit: Math.max(5, Math.min(60, Number(e.target.value))) })
                    }
                    disabled={disabled}
                    min={5}
                    max={60}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                  />
                  <span className="text-xs text-gray-500">초 (5~60)</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={() => onAdd?.()}
          disabled={quizzes.length >= 10}
          className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          + 문제 추가
        </button>
      )}
    </div>
  );
}
