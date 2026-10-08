export default function App() {
  const version = 'V3.0.1';

  return (
    <div
      style={{
        background: '#17171a',
        color: 'white',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <h1>Vietsub Video Studio {version}</h1>

      <button
        type="button"
        onClick={() => alert('Khởi chạy FFmpeg.wasm...')}
      >
        Render Video (Local)
      </button>
    </div>
  );
}
