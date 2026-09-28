const WashJob = require('../models/WashJob');
const Settings = require('../models/Settings');

/**
 * Assigns a free bay to a wash job, or places it in the queue if all bays are occupied.
 * @param {Object} job - Mongoose WashJob document
 */
async function assignBayOrQueue(job) {
  const settings = await Settings.findOne() || { activeBaysCount: 3 };
  const maxBays = settings.activeBaysCount;

  // Find all active wash jobs currently in a bay
  const occupiedBaysJobs = await WashJob.find({
    status: { $in: ['in-bay', 'washing', 'drying'] },
    bayNumber: { $ne: null }
  });

  const occupiedBays = occupiedBaysJobs.map(j => j.bayNumber);

  // Find first available bay number between 1 and maxBays
  let freeBay = null;
  for (let i = 1; i <= maxBays; i++) {
    if (!occupiedBays.includes(i)) {
      freeBay = i;
      break;
    }
  }

  if (freeBay !== null) {
    job.status = 'in-bay';
    job.bayNumber = freeBay;
    job.startTime = new Date();
  } else {
    job.status = 'queued';
    job.bayNumber = null;
  }
}

/**
 * Auto-advances the queue when a bay becomes free.
 * Finds the oldest queued job and assigns it to the freed bay.
 * @param {Number} freedBayNumber - The bay number that just became vacant
 * @param {Object} io - Socket.io server instance
 */
async function autoAdvanceQueue(freedBayNumber, io) {
  if (!freedBayNumber) return;

  // Find the oldest queued wash job
  const nextJob = await WashJob.findOne({ status: 'queued' }).sort({ createdAt: 1 });
  if (nextJob) {
    nextJob.status = 'in-bay';
    nextJob.bayNumber = freedBayNumber;
    nextJob.startTime = new Date();
    await nextJob.save();

    if (io) {
      const updatedQueue = await getQueueStatus();
      io.to('queue').emit('queue:update', updatedQueue);
      io.to('queue').emit('job:statusChange', {
        tokenNumber: nextJob.tokenNumber,
        vehicleReg: nextJob.vehicleReg,
        status: nextJob.status,
        message: `Vehicle ${nextJob.vehicleReg} has been pulled into Bay ${freedBayNumber} for servicing.`
      });
    }
  }
}

/**
 * Compiles the current queue and occupied bay status lists.
 * @returns {Promise<Object>} containing bays occupancy list and waiting queue list.
 */
async function getQueueStatus() {
  const settings = await Settings.findOne() || { activeBaysCount: 3 };
  const activeBaysCount = settings.activeBaysCount;

  // 1. Fetch occupied bays
  const activeJobs = await WashJob.find({
    status: { $in: ['in-bay', 'washing', 'drying'] }
  }).populate('customerId', 'name mobile');

  const bays = [];
  for (let i = 1; i <= activeBaysCount; i++) {
    const jobInBay = activeJobs.find(j => j.bayNumber === i);
    if (jobInBay) {
      bays.push({
        bayNo: i,
        occupied: true,
        jobId: jobInBay._id,
        tokenNumber: jobInBay.tokenNumber,
        vehicleReg: jobInBay.vehicleReg,
        vehicleType: jobInBay.vehicleType,
        status: jobInBay.status,
        startTime: jobInBay.startTime
      });
    } else {
      bays.push({
        bayNo: i,
        occupied: false,
        jobId: null,
        tokenNumber: null,
        vehicleReg: null,
        vehicleType: null,
        status: 'idle',
        startTime: null
      });
    }
  }

  // 2. Fetch waiting queue
  const waitingJobs = await WashJob.find({ status: 'queued' })
    .sort({ createdAt: 1 })
    .populate('customerId', 'name mobile');

  const waiting = waitingJobs.map((job, idx) => {
    // 20 mins wash average divided across concurrent bays
    const estimatedWait = Math.ceil(((idx + 1) * 20) / activeBaysCount);

    return {
      jobId: job._id,
      tokenNumber: job.tokenNumber,
      vehicleReg: job.vehicleReg,
      vehicleType: job.vehicleType,
      queuePosition: idx + 1,
      estimatedWait
    };
  });

  return { bays, waiting };
}

module.exports = {
  assignBayOrQueue,
  autoAdvanceQueue,
  getQueueStatus
};
