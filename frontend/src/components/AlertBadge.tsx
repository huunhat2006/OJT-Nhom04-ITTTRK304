// Tác giả: Frontend Developer - Alert Badge Component
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alertService } from '../lib/alertService';

interface AlertBadgeProps {
  spaceId?: number;
}

export default function AlertBadge({ spaceId }: AlertBadgeProps) {
  const [criticalCount, setCriticalCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!spaceId) return;

    const loadAlertCount = async () => {
      try {
        const data = await alertService.getSpendingAnalysis(spaceId);
        const critical = data.alerts.filter(a => a.severity === 'CRITICAL').length;
        setCriticalCount(critical);
        setTotalCount(data.alerts.length);
      } catch (error) {
        console.error('Failed to load alert count:', error);
      }
    };

    loadAlertCount();
  }, [spaceId]);

  if (totalCount === 0) return null;

  return (
    <Link
      to="/alerts"
      className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
    >
      <AlertTriangle className="w-4 h-4 text-red-600" />
      <span className="text-sm font-medium text-red-900">
        {criticalCount > 0 ? (
          <>
            <span className="font-bold">{criticalCount}</span> cảnh báo nghiêm trọng
          </>
        ) : (
          <>
            <span className="font-bold">{totalCount}</span> cảnh báo
          </>
        )}
      </span>
    </Link>
  );
}
