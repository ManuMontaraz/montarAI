/**
 * Newsletter Controller
 * Handles newsletter subscriptions and sending
 */

const crypto = require('crypto');
const User = require('../models/User');
const { sendNewsletterEmail } = require('../services/email');
const { translate } = require('../utils/translator');
const { validationResult } = require('express-validator');

/**
 * Subscribe to newsletter
 * POST /api/newsletters/subscribe
 * JWT optional - if provided, uses logged-in user's email
 * If no JWT, requires email in body
 */
const subscribe = async (req, res) => {
  const lang = req.lang || 'en';
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        key: 'validation_error',
        message: translate('errors.validation_failed', lang),
        errors: errors.array(),
        lang
      });
    }

    let email;
    let user;

    // If user is logged in, use their email
    if (req.user) {
      user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          key: 'user_not_found',
          message: translate('errors.user_not_found', lang),
          lang
        });
      }
      email = user.email;
    } else {
      // Otherwise, get email from body
      email = req.body.email;
      
      if (!email) {
        return res.status(400).json({
          key: 'email_required',
          message: translate('newsletter.email_required', lang),
          lang
        });
      }

      // Check if user exists with this email
      user = await User.findOne({ where: { email } });
    }

    if (user) {
      // User exists in database
      if (user.newsletterSubscribed) {
        return res.status(400).json({
          key: 'already_subscribed',
          message: translate('newsletter.already_subscribed', lang),
          lang
        });
      }

      // Update subscription
      await user.update({
        newsletterSubscribed: true,
        newsletterSubscribedAt: new Date(),
        newsletterUnsubscribedAt: null
      });
    } else {
      // User not registered - we only store email temporarily for this request
      // In a real app, you might want to store unregistered subscribers in a separate table
      return res.status(200).json({
        key: 'subscription_pending',
        message: translate('newsletter.pending_registration', lang),
        note: 'To receive newsletters, please create an account with this email.',
        lang
      });
    }

    res.status(200).json({
      key: 'subscription_success',
      message: translate('newsletter.subscribe_success', lang),
      lang
    });

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({
      key: 'server_error',
      message: translate('errors.server_error', lang),
      lang
    });
  }
};

/**
 * Unsubscribe from newsletter
 * POST /api/newsletters/unsubscribe
 * Can use JWT token or email in body
 */
const unsubscribe = async (req, res) => {
  const lang = req.lang || 'en';
  
  try {
    let email;
    let user;

    // If user is logged in, use their data
    if (req.user) {
      user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          key: 'user_not_found',
          message: translate('errors.user_not_found', lang),
          lang
        });
      }
    } else if (req.body.email) {
      // Otherwise, get email from body
      email = req.body.email;
      user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(404).json({
          key: 'user_not_found',
          message: translate('newsletter.email_not_found', lang),
          lang
        });
      }
    } else {
      return res.status(400).json({
        key: 'email_required',
        message: translate('newsletter.unsubscribe_email_required', lang),
        lang
      });
    }

    if (!user.newsletterSubscribed) {
      return res.status(400).json({
        key: 'not_subscribed',
        message: translate('newsletter.not_subscribed', lang),
        lang
      });
    }

    // Update subscription
    await user.update({
      newsletterSubscribed: false,
      newsletterUnsubscribedAt: new Date()
    });

    res.status(200).json({
      key: 'unsubscribe_success',
      message: translate('newsletter.unsubscribe_success', lang),
      lang
    });

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({
      key: 'server_error',
      message: translate('errors.server_error', lang),
      lang
    });
  }
};

/**
 * Send newsletter to all subscribed users
 * POST /api/newsletters/send
 * Admin only
 */
const sendNewsletter = async (req, res) => {
  const lang = req.lang || 'en';
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        key: 'validation_error',
        message: translate('errors.validation_failed', lang),
        errors: errors.array(),
        lang
      });
    }

    const { subject, content, testEmail } = req.body;

    // If testEmail provided, send only to that address
    if (testEmail) {
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');
      
      const result = await sendNewsletterEmail(
        testEmail,
        subject,
        content,
        unsubscribeToken,
        lang
      );

      if (result.success) {
        return res.status(200).json({
          key: 'test_email_sent',
          message: translate('newsletter.test_sent', lang),
          recipient: testEmail,
          lang
        });
      } else {
        return res.status(500).json({
          key: 'email_error',
          message: translate('newsletter.send_error', lang),
          error: result.error,
          lang
        });
      }
    }

    // Get all subscribed users
    const subscribers = await User.findAll({
      where: {
        newsletterSubscribed: true,
        status: 'active'
      }
    });

    if (subscribers.length === 0) {
      return res.status(200).json({
        key: 'no_subscribers',
        message: translate('newsletter.no_subscribers', lang),
        lang
      });
    }

    // Send newsletter to all subscribers
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const subscriber of subscribers) {
      try {
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        
        const result = await sendNewsletterEmail(
          subscriber.email,
          subject,
          content,
          unsubscribeToken,
          lang,
          subscriber
        );

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ email: subscriber.email, error: result.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ email: subscriber.email, error: error.message });
      }
    }

    res.status(200).json({
      key: 'newsletter_sent',
      message: translate('newsletter.sent_success', lang),
      stats: {
        total: subscribers.length,
        sent: results.sent,
        failed: results.failed
      },
      lang
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({
      key: 'server_error',
      message: translate('errors.server_error', lang),
      lang
    });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  sendNewsletter
};
