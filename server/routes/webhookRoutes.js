const express = require('express');
const router = express.Router();

const stripeService = require('../services/stripeService');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const escrowService = require('../services/escrowService');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/emailService');
const orderConfirmEmail = require('../templates/orderConfirmEmail');
const kycStatusEmail = require('../templates/kycStatusEmail');

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handles all async Stripe events. Registered with express.raw()
 *          BEFORE express.json() in app.js — Stripe signature verification
 *          requires the untouched raw request body.
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    const signature = req.headers['stripe-signature'];
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const orderId = intent.metadata.orderId;

        const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
        if (payment && payment.status !== 'succeeded') {
          payment.status = 'succeeded';
          payment.stripeChargeId = intent.latest_charge;
          await payment.save();
        }

        const order = await Order.findById(orderId);
        if (order && order.status === 'pending_payment') {
          await escrowService.markOrderEscrowHeld(order);

          // Notify the buyer their order + escrow hold is confirmed
          const populatedOrder = await Order.findById(orderId)
            .populate('buyer', 'name email')
            .populate('event', 'title');

          if (populatedOrder?.buyer?.email) {
            await sendEmail({
              to: populatedOrder.buyer.email,
              ...orderConfirmEmail({
                name: populatedOrder.buyer.name,
                orderNumber: populatedOrder.orderNumber,
                eventTitle: populatedOrder.event?.title,
                totalAmount: populatedOrder.totalAmount,
                currency: populatedOrder.currency,
              }),
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
        if (payment) {
          payment.status = 'failed';
          payment.failureReason = intent.last_payment_error?.message || 'Payment failed';
          await payment.save();
        }
        break;
      }

      case 'identity.verification_session.verified': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          const user = await User.findByIdAndUpdate(
            userId,
            {
              'kyc.status': 'verified',
              'kyc.verifiedAt': new Date(),
            },
            { new: true }
          );
          logger.info(`KYC verified for user ${userId}`);

          if (user?.email) {
            await sendEmail({
              to: user.email,
              ...kycStatusEmail({ name: user.name, status: 'verified' }),
            });
          }
        }
        break;
      }

      case 'identity.verification_session.requires_input': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          const rejectionReason =
            session.last_error?.reason || 'Verification requires additional input';

          const user = await User.findByIdAndUpdate(
            userId,
            {
              'kyc.status': 'rejected',
              'kyc.rejectionReason': rejectionReason,
            },
            { new: true }
          );

          if (user?.email) {
            await sendEmail({
              to: user.email,
              ...kycStatusEmail({ name: user.name, status: 'rejected', rejectionReason }),
            });
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        const user = await User.findOne({ 'stripeConnect.accountId': account.id });
        if (user) {
          user.stripeConnect.onboardingComplete = account.details_submitted;
          user.stripeConnect.payoutsEnabled = account.payouts_enabled;
          await user.save({ validateBeforeSave: false });
        }
        break;
      }

      default:
        // Unhandled event types are fine to ignore
        break;
    }

    res.json({ received: true });
  } catch (err) {
    logger.error(`Webhook handler error (${event.type}): ${err.message}`);
    // Return 200 anyway so Stripe doesn't endlessly retry a bug we need to fix server-side —
    // but log it loudly so it surfaces in monitoring.
    res.json({ received: true, error: 'Internal error logged.' });
  }
});

module.exports = router;