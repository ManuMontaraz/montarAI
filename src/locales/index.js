/**
 * MontarAI Backend - API REST
 * Copyright (C) 2024
 */

const es = require('./es.json');
const en = require('./en.json');

const locales = {
  es,
  en
};

const defaultLocale = 'en';
const supportedLocales = ['es', 'en'];

module.exports = {
  locales,
  defaultLocale,
  supportedLocales
};
