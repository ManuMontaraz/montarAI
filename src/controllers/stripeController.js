const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const listProducts = async (req, res) => {
  try {
    const { limit = 10, starting_after, ending_before } = req.query;

    const params = {
      active: true,
      expand: ['data.default_price'],
      limit: Math.min(parseInt(limit), 100)
    };

    if (starting_after) {
      params.starting_after = starting_after;
    }

    if (ending_before) {
      params.ending_before = ending_before;
    }

    const products = await stripe.products.list(params);

    const formattedProducts = products.data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      images: product.images,
      price: product.default_price ? {
        id: product.default_price.id,
        amount: product.default_price.unit_amount / 100,
        currency: product.default_price.currency
      } : null
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        has_more: products.has_more,
        total_count: products.total_count || formattedProducts.length,
        next_page: products.has_more ? products.data[products.data.length - 1]?.id : null,
        previous_page: products.data[0]?.id || null,
        current_limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json(req.t('stripe.error.products_fetch'));
  }
};

const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await stripe.products.retrieve(id);
    const prices = await stripe.prices.list({
      product: id,
      active: true
    });

    res.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        prices: prices.data.map(price => ({
          id: price.id,
          amount: price.unit_amount / 100,
          currency: price.currency
        }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json(req.t('stripe.error.product_fetch'));
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    const { items, shippingAddressId } = req.body;

    if (!items || !items.length) {
      return res.status(400).json(req.t('stripe.error.cart_empty'));
    }

    const { Address } = require('../models');
    const address = await Address.findOne({
      where: { id: shippingAddressId, userId: req.user.userId }
    });

    if (!address) {
      return res.status(400).json(req.t('stripe.error.invalid_address'));
    }

    let totalAmount = 0;
    const lineItems = [];

    for (const item of items) {
      const price = await stripe.prices.retrieve(item.priceId);
      const itemTotal = price.unit_amount * item.quantity;
      totalAmount += itemTotal;
      
      lineItems.push({
        price: item.priceId,
        quantity: item.quantity
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.user.userId,
        shippingAddressId: shippingAddressId
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creando payment intent:', error);
    res.status(500).json(req.t('stripe.error.payment_intent'));
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const { Order, User } = require('../models');
    const { sendOrderConfirmationEmail } = require('../services/email');

    const existingOrder = await Order.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (existingOrder) {
      console.log('Order already exists for this payment');
      return;
    }

    const order = await Order.create({
      userId: paymentIntent.metadata.userId,
      stripePaymentIntentId: paymentIntent.id,
      status: 'paid',
      totalAmount: paymentIntent.amount / 100,
      shippingAddressId: paymentIntent.metadata.shippingAddressId,
      metadata: {
        paymentMethod: paymentIntent.payment_method_types[0]
      }
    });

    const user = await User.findByPk(paymentIntent.metadata.userId);
    
    if (user) {
      await sendOrderConfirmationEmail(user.email, {
        orderId: order.id,
        total: order.totalAmount,
        date: order.createdAt
      });
    }

    console.log('Order created successfully:', order.id);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
};

module.exports = {
  listProducts,
  getProduct,
  createPaymentIntent,
  handleWebhook
};