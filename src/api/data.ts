/**
 * Data API Router
 * Demonstrates real-time data streaming and WebSocket integration
 */

import { Router, Request, Response } from 'express';
import { createLogger } from '@episensor/app-framework';

const logger = createLogger('DataAPI');

// Simulated data source
interface DataPoint {
  timestamp: string;
  value: number;
  unit: string;
  source: string;
}

// Generate random data for demonstration
function generateDataPoint(source: string): DataPoint {
  return {
    timestamp: new Date().toISOString(),
    value: Math.random() * 100,
    unit: 'kW',
    source
  };
}

export function createDataRouter(): Router {
  const router = Router();

  // Get current data snapshot
  router.get('/snapshot', (_req: Request, res: Response) => {
    try {
      const sources = ['solar', 'wind', 'battery', 'grid'];
      const data = sources.map(source => generateDataPoint(source));
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('Failed to get data snapshot', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve data',
        message: error.message
      });
    }
  });

  // Get historical data
  router.get('/history', (req: Request, res: Response) => {
    try {
      const { 
        source = 'all', 
        from = new Date(Date.now() - 3600000).toISOString(), 
        to = new Date().toISOString() 
      } = req.query;
      
      // Generate mock historical data
      const history: DataPoint[] = [];
      const startTime = new Date(from as string).getTime();
      const endTime = new Date(to as string).getTime();
      const interval = 60000; // 1 minute intervals
      
      for (let time = startTime; time <= endTime; time += interval) {
        if (source === 'all') {
          ['solar', 'wind', 'battery', 'grid'].forEach(s => {
            history.push({
              timestamp: new Date(time).toISOString(),
              value: Math.random() * 100,
              unit: 'kW',
              source: s
            });
          });
        } else {
          history.push({
            timestamp: new Date(time).toISOString(),
            value: Math.random() * 100,
            unit: 'kW',
            source: source as string
          });
        }
      }
      
      res.json({
        success: true,
        data: history,
        count: history.length,
        query: { source, from, to }
      });
    } catch (error: any) {
      logger.error('Failed to get historical data', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve historical data',
        message: error.message
      });
    }
  });

  // Get aggregated statistics
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const { period = '1h' } = req.query;
      
      // Generate mock statistics
      const stats = {
        period,
        sources: {
          solar: {
            average: 45.2,
            min: 0,
            max: 85.3,
            total: 542.4
          },
          wind: {
            average: 32.1,
            min: 5.2,
            max: 78.9,
            total: 385.2
          },
          battery: {
            average: 25.5,
            min: -50,
            max: 50,
            total: 306.0,
            soc: 65 // State of charge %
          },
          grid: {
            average: 15.3,
            min: -20,
            max: 45,
            total: 183.6,
            imported: 250.2,
            exported: 66.6
          }
        },
        summary: {
          totalGeneration: 927.6,
          totalConsumption: 855.4,
          netExport: 72.2,
          efficiency: 92.2
        },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Failed to get statistics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics',
        message: error.message
      });
    }
  });

  // Trigger data export
  router.post('/export', async (req: Request, res: Response) => {
    try {
      const { format = 'csv', period = '24h' } = req.body;
      
      // In a real app, this would queue an export job
      const exportJob = {
        id: `export-${Date.now()}`,
        format,
        period,
        status: 'queued',
        createdAt: new Date().toISOString()
      };
      
      logger.info('Export job queued', exportJob);
      
      res.status(202).json({
        success: true,
        data: exportJob,
        message: 'Export job queued successfully'
      });
    } catch (error: any) {
      logger.error('Failed to queue export', error);
      res.status(500).json({
        success: false,
        error: 'Failed to queue export',
        message: error.message
      });
    }
  });

  return router;
}