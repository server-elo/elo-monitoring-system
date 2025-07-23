'use client';

export default function TestMinimalPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Minimal Test Page</h1>
      <p>This page tests if the environment validation errors are fixed.</p>
      <p>Status: ✅ If you can see this without errors, the fix worked!</p>
    </div>
  );
}