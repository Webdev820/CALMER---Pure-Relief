const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passkey: { type: String, required: true }, // bcrypt hashed CALMER passkey
  role: { type: String, enum: ['client', 'admin'], default: 'client' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  cart: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product' }, quantity: { type: Number, default: 1 } }]
}, { timestamps: true });

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['Flower', 'Edibles', 'Oils', 'Vapes', 'Concentrates', 'Accessories'], default: 'Flower' },
  price: { type: Number, required: true },
  thcContent: { type: String, default: '' },
  cbdContent: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false }
}, { timestamps: true });

const OrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  deliveryFee: { type: Number, default: 10 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentMethod: { type: String, default: 'paypal' },
  deliveryStatus: { type: String, enum: ['pending', 'processing', 'on_the_way', 'delivered'], default: 'pending' },
  deliveryAddress: {
    street: String,
    city: String,
    landmark: String,
    notes: String
  },
  liveLocation: {
    latitude: Number,
    longitude: Number,
    pinned: { type: Boolean, default: false },
    timestamp: Date
  },
  estimatedDeliveryTime: { type: String, default: '30 minutes' },
  actualDeliveryTime: Date,
  rating: { type: Number, min: 1, max: 5 },
  review: String
}, { timestamps: true });

OrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`;
  }
  next();
});

const NotificationSchema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
  broadcast: { type: Boolean, default: false }, // true = all clients
  type: { type: String, enum: ['new_arrival', 'payment_received', 'order_update', 'delivery_alert', 'message', 'system'], default: 'system' },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  meta: { type: Object, default: {} }
}, { timestamps: true });

const ConversationSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderName: String,
    message: String,
    type: { type: String, enum: ['text', 'system', 'call_initiation', 'pin_request'], default: 'text' },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }],
  callLogs: [{
    initiator: { type: Schema.Types.ObjectId, ref: 'User' },
    duration: Number,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Product: mongoose.model('Product', ProductSchema),
  Order: mongoose.model('Order', OrderSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  Conversation: mongoose.model('Conversation', ConversationSchema)
};
