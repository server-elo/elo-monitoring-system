'use client';

export default function TestPage() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', fontSize: '2rem' }}>Test Page - CSS Working!</h1>
      <p style={{ color: '#666' }}>If you can see this styled text, inline CSS is working.</p>
      
      <div className="bg-blue-500 text-white p-4 rounded-lg mt-4">
        <p>If this box is blue with white text, Tailwind CSS is working!</p>
      </div>
      
      <style jsx>{`
        .test-class {
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          color: white;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }
      `}</style>
      
      <div className="test-class">
        If this has a gradient background, styled-jsx is working!
      </div>
    </div>
  );
}