'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: '福岡市内のどこで活動予定ですか？',
    answer: '今のところ固定の場所はなく、レンタルスペースを活用する予定です。'
  },
  {
    question: '特定の人だけが閲覧できる環境で展示することもできますか？',
    answer: 'できます。パスワードをかけることで閲覧を制限します。'
  },
  {
    question: 'Meta Quest以外のVRゴーグルでも閲覧できますか？',
    answer: 'できますが、不具合もしくは画質低下の可能性があります。'
  },
  {
    question: '商用で利用できますか？',
    answer: '現在個人での利用のみに限定しています。VRギャラリーの利用により生じた一切の損害に関して責任を負いませんので、個人の責任でご利用ください。'
  },
  {
    question: 'どんな作品でも展示できますか？',
    answer: 'アダルトコンテンツなど、アート作品であっても管理者が相応しくないと判断した内容の展示はお断りします。'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            よくある質問
          </h2>
          <div className="w-16 h-0.5 bg-slate-300 mx-auto mt-3"></div>
        </div>
        
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-start gap-3 p-6 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                  Q
                </span>
                <p className="font-semibold text-slate-800 pt-1 flex-1">
                  {faq.question}
                </p>
                <svg
                  className={`flex-shrink-0 w-6 h-6 text-slate-600 transition-transform duration-200 mt-1 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 ml-11">
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-slate-700 leading-relaxed mt-3">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
