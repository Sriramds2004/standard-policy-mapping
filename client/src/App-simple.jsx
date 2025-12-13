import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Loading...');
  
  useEffect(() => {
    setMessage('Policy Documents Module - React App Loaded Successfully!');
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Policy Documents Module</h1>
      <p>{message}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
        <h2>Quick Test</h2>
        <p>If you can see this, React is working correctly!</p>
        <button onClick={() => setMessage('Button clicked! React is interactive.')}>
          Test Button
        </button>
      </div>
    </div>
  );
}

export default App;