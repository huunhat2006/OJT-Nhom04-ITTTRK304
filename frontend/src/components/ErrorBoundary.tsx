// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches uncaught render errors and shows a friendly
 * fallback page instead of a blank screen.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyPage />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in development — swap with a real error reporting service in prod
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in"
          role="alert"
          aria-live="assertive"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-danger/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-danger" aria-hidden="true" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Oops! Có lỗi xảy ra
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-2">
            Một lỗi không mong muốn đã xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
          </p>

          {/* Error message (dev hint) */}
          {this.state.error && (
            <details className="mt-2 mb-6 text-left w-full max-w-sm">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 select-none">
                Chi tiết lỗi
              </summary>
              <pre className="mt-2 text-xs text-danger bg-danger/5 rounded-lg p-3 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={this.handleReset}
              className="btn btn-primary flex items-center gap-2"
              aria-label="Thử lại"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
            <a
              href="/"
              className="btn btn-secondary flex items-center gap-2"
              aria-label="Về trang chủ"
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
