const Order = require('../models/Order');
const { sendEmail } = require('../services/emailService');
const deliveryReminderEmail = require('../templates/deliveryReminderEmail');
const logger = require('../utils/logger');

/**
 * Sends a reminder to sellers who are approaching (but haven't yet
 * missed) their 48hr delivery deadline — good UX, reduces missed
 * deadlines and therefore reduces disputes/refunds.
 * Runs once per hour; sends when deadline is between 6-7 hours away
 * (a 1-hour window keeps this idempotent-ish without needing a
 * "reminderSent" flag on the Order model for MVP).
 */
const runDeliveryReminders = async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    const orders = await Order.find({
      status: 'paid_escrow_held',
      deliveryDeadline: { $gte: windowStart, $lte: windowEnd },
    })
      .populate('seller', 'name email')
      .populate('event', 'title eventDate');

    if (orders.length === 0) {
      logger.debug('[cron] reminderEmails: nothing to send.');
      return;
    }

    for (const order of orders) {
      if (!order.seller?.email) continue;

      await sendEmail({
        to: order.seller.email,
        ...deliveryReminderEmail({
          sellerName: order.seller.name,
          orderNumber: order.orderNumber,
          eventTitle: order.event?.title,
        }),
      });
    }

    logger.info(`[cron] reminderEmails: sent ${orders.length} deadline reminder(s).`);
  } catch (err) {
    logger.error(`[cron] reminderEmails fatal error: ${err.message}`);
  }
};

module.exports = runDeliveryReminders;