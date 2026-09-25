import { useState } from 'react';

function App() {
  const [status, setStatus] = useState<string>('Đang chờ kết nối...');

  const checkBackend = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setStatus(`Backend: ${data.status} | API Key Loaded: ${data.hasApiKey}`);
    } catch (err) {
      setStatus('Lỗi kết nối Backend. Hãy chắc chắn Node.js đang chạy ở port 3000.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Vietsub Video Studio - MCP System</h1>
      <p>Trạng thái hệ thống: <strong>{status}</strong></p>
      <button onClick={checkBackend} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Kiểm tra Backend Node.js
      </button>
    </div>
  );
}

export default App;
