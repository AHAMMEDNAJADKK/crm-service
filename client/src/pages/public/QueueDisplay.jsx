import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import useQueueStore from '../../store/queueStore';
import useUiStore from '../../store/uiStore';

export const QueueDisplay = () => {
  const queryClient = useQueryClient();
  const { bays, waiting, setQueueData } = useQueueStore();
  const { stationSettings } = useUiStore();

  // Fetch queue board data initially
  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['publicQueueStatus'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/public/queue');
      return data.data;
    }
  });

  // Keep Zustand store in sync with query
  useEffect(() => {
    if (queueData) {
      setQueueData(queueData.baysOccupied, queueData.waitingQueue);
    }
  }, [queueData, setQueueData]);

  // Hook up Socket.io for real-time TV dashboard pushes
  useSocket('queue', (updatedData) => {
    console.log('⚡ Received real-time queue status update via socket:', updatedData);
    setQueueData(updatedData.baysOccupied, updatedData.waitingQueue);
    // Also trigger query invalidate to sync React Query cache
    queryClient.invalidateQueries({ queryKey: ['publicQueueStatus'] });
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-bay': return 'bg-blue-50 text-blue-600 border-blue-200/50';
      case 'washing': return 'bg-amber-50 text-amber-600 border-amber-200/50 animate-pulse';
      case 'drying': return 'bg-teal-50 text-teal-600 border-teal-200/50';
      case 'ready': return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
      default: return 'bg-slate-50 text-slate-600 border-slate-200/50';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'in-bay') return 'Positioned';
    if (status === 'washing') return 'Washing Deck';
    if (status === 'drying') return 'Drying Bay';
    if (status === 'ready') return 'Ready for Delivery';
    return status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wider text-slate-400">LOADING LIVE DISPLAY BOARD...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen pt-24 pb-12 text-slate-100 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col gap-8">
        
        {/* Header Board */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-slate-900 border border-slate-800 p-6 rounded-3xl gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest">LIVE BOARD ACTIVE</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {stationSettings?.logoUrl && (
                <img
                  src={`${api.defaults.baseURL || ''}${stationSettings.logoUrl}`}
                  alt="Logo"
                  className="max-h-10 object-contain bg-slate-900 p-0.5 rounded"
                />
              )}
              <h1 className="text-2xl font-black tracking-tight text-white">
                {stationSettings?.stationName || 'AquaClean'} Live Station Deck
              </h1>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-slate-800/80 border border-slate-800 px-4 py-3 rounded-2xl flex flex-col min-w-[100px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Bays In-Use</span>
              <span className="text-xl font-black text-white mt-1">
                {bays.filter(b => b.status !== 'ready').length} / {queueData?.activeBays || 3}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-800 px-4 py-3 rounded-2xl flex flex-col min-w-[100px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Vehicles Waiting</span>
              <span className="text-xl font-black text-brand-400 mt-1">{waiting.length}</span>
            </div>
          </div>
        </div>

        {/* Live Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
          
          {/* Active Servicing Bays */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2">
              <PlayCircle className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-extrabold text-white tracking-tight">Active Servicing Bays</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: queueData?.activeBays || 3 }).map((_, idx) => {
                const bayNo = idx + 1;
                // Find occupied job in this bay (not ready, or ready recently)
                const activeJob = bays.find(b => b.bayNumber === bayNo);

                return (
                  <div key={bayNo} className={`border p-6 rounded-3xl flex flex-col justify-between min-h-[220px] transition-all relative ${
                    activeJob 
                      ? 'bg-slate-900 border-slate-800 shadow-md' 
                      : 'bg-slate-950 border-dashed border-slate-800 text-slate-600'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">BAY {bayNo}</span>
                        {activeJob && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getStatusColor(activeJob.status)}`}>
                            {getStatusLabel(activeJob.status)}
                          </span>
                        )}
                      </div>

                      {activeJob ? (
                        <div className="mt-6">
                          <h3 className="text-xl font-black text-white tracking-wider font-mono">
                            {activeJob.vehicleReg}
                          </h3>
                          <p className="text-[10px] text-brand-400 font-bold uppercase mt-1">
                            {activeJob.washPackage.replace('-', ' ')}
                          </p>
                          
                          {/* simple progress indicators */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-6">
                            <div className={`h-full transition-all duration-500 ${
                              activeJob.status === 'in-bay' ? 'w-1/4 bg-blue-500' :
                              activeJob.status === 'washing' ? 'w-2/3 bg-amber-500 animate-pulse' :
                              activeJob.status === 'drying' ? 'w-5/6 bg-teal-500' : 'w-full bg-emerald-500'
                            }`} />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-12 text-center flex flex-col items-center">
                          <span className="text-3xl text-slate-800">💧</span>
                          <span className="text-xs font-bold uppercase text-slate-600 tracking-wider mt-3">Bay Available</span>
                        </div>
                      )}
                    </div>

                    {activeJob && (
                      <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-3">
                        <span>Staff: {activeJob.assignedStaff}</span>
                        <span>Token: {activeJob.tokenNumber}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waiting Queue list */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2">
              <Clock className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-extrabold text-white tracking-tight">Queue Waitlist</h2>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 flex-grow max-h-[500px] overflow-y-auto">
              {waiting.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center flex-grow text-slate-500 gap-2">
                  <span className="text-4xl text-slate-800">🌴</span>
                  <p className="text-xs font-bold uppercase">No vehicles waiting</p>
                </div>
              ) : (
                waiting.map((job, idx) => {
                  // Calculate dynamic wait time
                  const activeBaysCount = queueData?.activeBays || 3;
                  const estimatedWait = Math.ceil(((idx + 1) * 20) / activeBaysCount);

                  return (
                    <div key={job._id} className="flex justify-between items-center bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-white tracking-wide">{job.vehicleReg}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 block">
                          Token: {job.tokenNumber}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-brand-400 font-extrabold tracking-tight">
                          ~{estimatedWait} mins
                        </span>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">Est. Wait</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default QueueDisplay;
