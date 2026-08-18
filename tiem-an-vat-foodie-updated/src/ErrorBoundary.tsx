import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

// Bắt mọi lỗi runtime không lường trước xảy ra khi render, để hiển thị màn hình
// báo lỗi thân thiện thay vì trắng trang hoàn toàn (React mặc định sẽ unmount
// toàn bộ cây component khi có lỗi không được xử lý trong lúc render).
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Đã xảy ra lỗi không xác định.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Lỗi runtime không bắt được:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc'
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Đã có lỗi xảy ra</h1>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px' }}>
            Trang gặp sự cố khi hiển thị. Vui lòng bấm nút bên dưới để tải lại trang.
            Nếu lỗi vẫn tiếp diễn, hãy chụp lại màn hình này (bao gồm dòng chi tiết lỗi) để gửi báo lỗi.
          </p>
          <pre style={{
            fontSize: '11px',
            color: '#dc2626',
            background: '#fef2f2',
            padding: '12px 16px',
            borderRadius: '8px',
            maxWidth: '600px',
            overflowX: 'auto',
            textAlign: 'left'
          }}>
            {this.state.errorMessage}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
