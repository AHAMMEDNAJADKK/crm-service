const mongoose = require('mongoose');
const { Schema } = mongoose;

const waterLogSchema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  litresUsed: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WaterLog', waterLogSchema);
