var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util');

var NotificationSchema = new Schema({
	date: {type: Date, default: function(){ return Date.now(); }}
  , read: {type: Boolean, default: false}
  , text: String
  , player: {type: Schema.ObjectId, ref: 'Player'}
});

var Notification = mongoose.model('Notification', NotificationSchema);
exports = Notification;