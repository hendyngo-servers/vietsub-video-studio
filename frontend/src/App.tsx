export default function App() {
  return (
    <div
      style={{
        background: '#17171a',
        color: 'white',
        height: '100vh',
        padding: '20px',
      }}
    >
      <h1>Vietsub Video Studio V3.0</h1>

      <button onClick={() => alert('Khởi chạy FFmpeg.wasm...')}>
        Render Video (Local)
      </button>
    </div>
  );
}
