import { useState } from 'react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);

  const handleCreateVideo = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gemini/create-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      if (result.success) {
        setScriptData(result.script);
      } else {
        alert('Lỗi: ' + (result.error || 'Không thể tạo kịch bản'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Vietsub Video Studio</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Nhập ý tưởng video..."
        rows={4}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <br />
      <button onClick={handleCreateVideo} disabled={loading}>
        {loading ? 'Đang tạo kịch bản AI...' : 'Tạo kịch bản Video'}
      </button>

      {scriptData && (
        <div style={{ marginTop: '2rem' }}>
          <h2>{scriptData.title}</h2>
          <ul>
            {scriptData.scenes?.map((scene: any, index: number) => (
              <li key={index} style={{ marginBottom: '1rem' }}>
                <strong>Cảnh {index + 1}:</strong>
                <p>🎬 <strong>Hình ảnh:</strong> {scene.visual}</p>
                <p>🎙️ <strong>Thuyết minh:</strong> {scene.audio}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
