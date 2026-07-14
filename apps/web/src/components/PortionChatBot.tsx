import { useState, useRef, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function PortionChatBot({ foodName, onApplyQuantity }: { foodName: string; onApplyQuantity: (g: number) => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Xin chào! Tôi có thể giúp bạn ước lượng khối lượng phần ăn. Hãy hỏi tôi về khối lượng chuẩn của món ăn nhé.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const prompt = `Bạn là chuyên gia dinh dưỡng ẩm thực Việt Nam. Hãy trả lời câu hỏi sau bằng tiếng Việt, ngắn gọn và thực tế. Nếu câu hỏi liên quan đến khối lượng/portion, hãy đưa ra ước lượng cụ thể bằng gam, kèm theo giải thích ngắn. Nếu không liên quan đến khối lượng phần ăn, hãy trả lời lịch sự rằng bạn chỉ hỗ trợ về khối lượng phần ăn.

Câu hỏi: ${userMsg}${foodName ? ` (Món hiện tại: ${foodName})` : ''}`;

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      setMessages((m) => [...m, { role: 'assistant', content: text }]);
    } catch (err) {
      console.error('Chatbot Gemini error:', err);
      message.error('Lỗi AI: ' + (err as Error).message);
      setMessages((m) => [...m, { role: 'assistant', content: 'Xin lỗi, tôi gặp lỗi khi xử lý. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  const extractAndApplyWeight = (text: string) => {
    const match = text.match(/(\d{2,4})\s*g/);
    if (match && onApplyQuantity) {
      const grams = Number(match[1]);
      if (grams > 0) {
        onApplyQuantity(grams);
        message.success(`Đã áp dụng khối lượng ${grams}g`);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-16 right-0 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-emerald-600 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <RobotOutlined /> Chatbot khối lượng
            </span>
            <Button type="text" size="small" onClick={() => setOpen(false)} className="!text-white">
              ✕
            </Button>
          </div>
          <div className="h-80 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {m.content}
                  {m.role === 'assistant' && i === messages.length - 1 && !loading && (
                    <Button type="link" size="small" className="mt-1 !p-0 !text-emerald-600" onClick={() => extractAndApplyWeight(m.content)}>
                      Áp dụng khối lượng
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-slate-400">Đang trả lời...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 border-t border-slate-100 p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={(e) => { e.preventDefault(); handleSend(); }}
              placeholder="Hỏi về khối lượng phần ăn..."
              className="!rounded-xl"
              disabled={loading}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} className="!rounded-xl" />
          </div>
        </div>
      )}
      <Button type="primary" shape="circle" size="large" icon={<RobotOutlined />} onClick={() => setOpen((v) => !v)} className="!bg-emerald-600 shadow-lg" />
    </div>
  );
}
