const WaterLog = require('../models/WaterLog');

exports.logWaterUsage = async (req, res, next) => {
  try {
    const { date, litresUsed, notes } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, error: 'date is required' });
    }

    const logDate = new Date(date);
    logDate.setHours(0,0,0,0);

    const log = await WaterLog.findOneAndUpdate(
      { date: logDate },
      { litresUsed: parseFloat(litresUsed) || 0, notes },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Water usage logged successfully',
      data: log
    });
  } catch (err) {
    next(err);
  }
};

exports.getWaterLogs = async (req, res, next) => {
  try {
    const logs = await WaterLog.find({}).sort({ date: -1 }).limit(30);
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};
