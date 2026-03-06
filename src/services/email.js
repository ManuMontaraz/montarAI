/**
 * MontarAI Backend - API REST
 * Copyright (C) 2024
 */

const nodemailer = require('nodemailer');
const { translate } = require('../utils/translator');
const appConfig = require('../config/app');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Genera el HTML del footer del email
 * Incluye redes sociales, información de empresa y links legales condicionalmente
 */
const generateEmailFooter = (lang = 'en') => {
  const parts = [];
  
  // Redes sociales (solo si hay alguna configurada)
  const socialLinks = appConfig.getActiveSocialLinks();
  if (socialLinks.length > 0) {
    const socialHtml = socialLinks.map(social => 
      `<a href="${social.url}" style="margin: 0 10px; color: ${appConfig.branding.primaryColor};">${social.name}</a>`
    ).join(' | ');
    
    parts.push(`
      <div style="margin: 20px 0; padding: 15px 0; border-top: 1px solid #eee;">
        <p style="margin: 0 0 10px 0; color: #666;">${translate('mail.footer.social_title', lang)}</p>
        <p style="margin: 0;">${socialHtml}</p>
      </div>
    `);
  }
  
  // Información de la empresa (solo si hay datos)
  if (appConfig.company.name || appConfig.company.address) {
    const companyInfo = [];
    if (appConfig.company.name) companyInfo.push(appConfig.company.name);
    if (appConfig.company.address) companyInfo.push(appConfig.company.address);
    
    parts.push(`
      <div style="margin: 15px 0; color: #666; font-size: 12px;">
        <p style="margin: 5px 0;">${companyInfo.join(' - ')}</p>
        ${appConfig.company.cif ? `<p style="margin: 5px 0;">CIF: ${appConfig.company.cif}</p>` : ''}
      </div>
    `);
  }
  
  // Links legales (solo los que están configurados)
  const legalUrls = [];
  if (appConfig.urls.terms) {
    legalUrls.push(`<a href="${appConfig.urls.terms}" style="color: ${appConfig.branding.primaryColor}; margin: 0 5px;">${translate('mail.footer.terms', lang)}</a>`);
  }
  if (appConfig.urls.privacy) {
    legalUrls.push(`<a href="${appConfig.urls.privacy}" style="color: ${appConfig.branding.primaryColor}; margin: 0 5px;">${translate('mail.footer.privacy', lang)}</a>`);
  }
  if (appConfig.urls.legal) {
    legalUrls.push(`<a href="${appConfig.urls.legal}" style="color: ${appConfig.branding.primaryColor}; margin: 0 5px;">${translate('mail.footer.legal', lang)}</a>`);
  }
  if (appConfig.urls.cookies) {
    legalUrls.push(`<a href="${appConfig.urls.cookies}" style="color: ${appConfig.branding.primaryColor}; margin: 0 5px;">${translate('mail.footer.cookies', lang)}</a>`);
  }
  
  if (legalUrls.length > 0) {
    parts.push(`
      <div style="margin: 15px 0; padding-top: 15px; border-top: 1px solid #eee;">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">${translate('mail.footer.legal_links', lang)}</p>
        <p style="margin: 0; font-size: 12px;">${legalUrls.join(' | ')}</p>
      </div>
    `);
  }
  
  return parts.join('');
};

/**
 * Envuelve el contenido del email en una plantilla HTML base
 */
const wrapEmailTemplate = (content, lang = 'en') => {
  const logoHtml = appConfig.branding.logoUrl 
    ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${appConfig.branding.logoUrl}" alt="${appConfig.name}" style="max-width: 200px;"></div>`
    : `<div style="text-align: center; margin-bottom: 20px;"><h2 style="color: ${appConfig.branding.primaryColor}; margin: 0;">${appConfig.name}</h2></div>`;
  
  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${appConfig.name}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${logoHtml}
      <div style="background: #f9f9f9; padding: 30px; border-radius: 8px;">
        ${content}
      </div>
      ${generateEmailFooter(lang)}
    </body>
    </html>
  `;
};

const sendEmail = async ({ to, subject, html, lang = 'en' }) => {
  try {
    const wrappedHtml = wrapEmailTemplate(html, lang);
    
    const info = await transporter.sendMail({
      from: `"${appConfig.email.fromName}" <${appConfig.email.fromAddress}>`,
      to,
      subject,
      html: wrappedHtml
    });
    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

const sendVerificationEmail = async (email, token, lang = 'en', user = {}) => {
  const verificationUrl = `${appConfig.url}/verify-email?token=${token}`;
  
  const content = `
    <h1 style="color: ${appConfig.branding.primaryColor};">${translate('mail.verify_email.salute', lang)}</h1>
    <p>${translate('mail.verify_email.body', lang)}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="padding: 12px 30px; background: ${appConfig.branding.primaryColor}; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">${translate('mail.verify_email.button', lang)}</a>
    </div>
    <p style="font-size: 12px; color: #666;">${translate('mail.verify_email.fallback', lang)}</p>
    <p style="font-size: 12px; word-break: break-all;">${verificationUrl}</p>
  `;
  
  return await sendEmail({
    to: email,
    subject: translate('mail.verify_email.subject', lang),
    html: content,
    lang
  });
};

const sendPasswordResetEmail = async (email, token, lang = 'en', user = {}) => {
  const resetUrl = `${appConfig.url}/reset-password?token=${token}`;
  
  const content = `
    <h1 style="color: ${appConfig.branding.primaryColor};">${translate('mail.reset_password.salute', lang, { firstName: user.firstName || '' })}</h1>
    <p>${translate('mail.reset_password.body', lang)}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="padding: 12px 30px; background: ${appConfig.branding.primaryColor}; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">${translate('mail.reset_password.button', lang)}</a>
    </div>
    <p style="color: #dc3545; font-size: 14px;">${translate('mail.reset_password.expires', lang)}</p>
    <p style="font-size: 12px; color: #666;">${translate('mail.reset_password.ignore', lang)}</p>
  `;
  
  return await sendEmail({
    to: email,
    subject: translate('mail.reset_password.subject', lang),
    html: content,
    lang
  });
};

const sendOrderConfirmationEmail = async (email, orderDetails, lang = 'en') => {
  const content = `
    <h1 style="color: ${appConfig.branding.primaryColor};">${translate('mail.order_confirmation.title', lang)}</h1>
    <p>${translate('mail.order_confirmation.body', lang)}</p>
    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: ${appConfig.branding.primaryColor};">${translate('mail.order_confirmation.order_details', lang)}</h3>
      <p><strong>${translate('mail.order_confirmation.order_number', lang)}</strong> ${orderDetails.orderId}</p>
      <p><strong>${translate('mail.order_confirmation.total', lang)}</strong> ${orderDetails.total} €</p>
      <p><strong>${translate('mail.order_confirmation.date', lang)}</strong> ${orderDetails.date}</p>
    </div>
    <p style="color: #666; font-size: 14px;">${translate('mail.order_confirmation.shipping_notice', lang)}</p>
  `;
  
  return await sendEmail({
    to: email,
    subject: translate('mail.order_confirmation.subject', lang, { orderId: orderDetails.orderId }),
    html: content,
    lang
  });
};

const sendRefundConfirmationEmail = async (email, orderDetails, lang = 'en') => {
  const content = `
    <h1 style="color: ${appConfig.branding.primaryColor};">${translate('mail.refund.subject', lang)}</h1>
    <p>${translate('mail.refund.salute', lang, { firstName: orderDetails.firstName || '' })}</p>
    <p>${translate('mail.refund.body', lang, { orderId: orderDetails.orderId })}</p>
    <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0;"><strong>${translate('mail.refund.amount', lang)}</strong> ${orderDetails.total} €</p>
    </div>
    <p style="color: #666; font-size: 14px;">${translate('mail.refund.timeline', lang)}</p>
  `;
  
  return await sendEmail({
    to: email,
    subject: translate('mail.refund.subject', lang),
    html: content,
    lang
  });
};

const sendRefundRejectionEmail = async (email, orderDetails, reason, lang = 'en') => {
  const content = `
    <h1 style="color: #dc3545;">${translate('mail.refund_rejected.subject', lang)}</h1>
    <p>${translate('mail.refund_rejected.salute', lang, { firstName: orderDetails.firstName || '' })}</p>
    <p>${translate('mail.refund_rejected.body', lang, { orderId: orderDetails.orderId })}</p>
    ${reason ? `<div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="margin: 0;"><strong>${translate('mail.refund_rejected.reason', lang)}</strong> ${reason}</p></div>` : ''}
    <p style="color: #666; font-size: 14px;">${translate('mail.refund_rejected.contact', lang)}</p>
  `;
  
  return await sendEmail({
    to: email,
    subject: translate('mail.refund_rejected.subject', lang),
    html: content,
    lang
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendRefundConfirmationEmail,
  sendRefundRejectionEmail
};
