// Tác giả: Frontend Developer - Alert Service
import api from './axios';
import { SpendingAnalysisResponse } from '../types';

/**
 * Service for managing spending alerts and analysis
 */
class AlertService {
  /**
   * Get spending analysis for current space/month
   */
  async getSpendingAnalysis(spaceId?: number): Promise<SpendingAnalysisResponse> {
    const params = spaceId ? { spaceId } : {};
    const { data } = await api.get<SpendingAnalysisResponse>('/alerts/analysis', { params });
    return data;
  }

  /**
   * Trigger manual spending check
   */
  async triggerManualCheck(spaceId?: number): Promise<void> {
    const params = spaceId ? { spaceId } : {};
    await api.post('/alerts/check-now', null, { params });
  }

  /**
   * Get alerts for specific month/year
   */
  async getAlertsByMonth(
    spaceId: number,
    month: number,
    year: number
  ): Promise<SpendingAnalysisResponse> {
    const { data } = await api.get<SpendingAnalysisResponse>('/alerts/analysis', {
      params: { spaceId, month, year },
    });
    return data;
  }
}

export const alertService = new AlertService();
export default alertService;
