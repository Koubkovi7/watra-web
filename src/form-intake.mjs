export const formReady = config => !!(config.fullFormEnabled && config.privacyApproved && config.email && /^0x[a-zA-Z0-9_-]+$/.test(config.turnstileSiteKey || ''));
