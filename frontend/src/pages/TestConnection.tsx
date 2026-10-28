// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useState } from 'react';
import axios from 'axios';

export default function TestConnection() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail: 'admin',
          password: 'Admin@1234',
        }),
      });
      
      const data = await response.json();
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
    } catch (error: any) {
      setResult({
        error: error.message,
        stack: error.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithAxios = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
        usernameOrEmail: 'admin',
        password: 'Admin@1234',
      });
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    } catch (error: any) {
      setResult({
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Backend Connection</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="space-y-2">
            <button
              onClick={testBackend}
              disabled={loading}
              className="btn btn-primary mr-4"
            >
              Test with Fetch
            </button>
            
            <button
              onClick={testWithAxios}
              disabled={loading}
              className="btn btn-secondary"
            >
              Test with Axios
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Testing connection...</p>
            </div>
          )}

          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Result:</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Credentials:</h3>
            <div className="text-sm space-y-1">
              <p><strong>Admin:</strong></p>
              <p className="ml-4">Username: admin</p>
              <p className="ml-4">Password: Admin@1234</p>
              <br />
              <p><strong>User:</strong></p>
              <p className="ml-4">Username: nguyen.van.a</p>
              <p className="ml-4">Password: User@1234</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold mb-2">Checklist:</h3>
            <ul className="text-sm space-y-1 list-disc ml-6">
              <li>Backend running at <code className="bg-gray-200 px-1">http://localhost:8080</code></li>
              <li>Database connected and migrations ran</li>
              <li>Open F12 Console to see detailed logs</li>
              <li>Check Network tab for the actual request/response</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
