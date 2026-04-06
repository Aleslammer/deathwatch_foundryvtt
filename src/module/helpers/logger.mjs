/**
 * Centralized logging system using Foundry's logger infrastructure.
 * Provides structured logging with configurable log levels.
 *
 * @example
 * Logger.debug('COMBAT', 'Applying damage', damageData);
 * Logger.info('INIT', 'System initialized');
 * Logger.warn('MODIFIERS', 'Deprecated modifier type used');
 * Logger.error('SKILLS', 'Skills not loaded');
 */
export class Logger {
  static _logger = null;

  /**
   * Initialize the Foundry logger with user-configured log level.
   * Called during system initialization.
   */
  static init() {
    // Get log level from settings (defaults to INFO if not set or game not ready)
    let logLevel = 'INFO';
    try {
      if (typeof game !== 'undefined' && game && game.settings && typeof game.settings.get === 'function') {
        logLevel = game.settings.get('deathwatch', 'logLevel') || 'INFO';
      }
    } catch (error) {
      // Settings not registered yet, use default
    }

    // Map string level to Foundry's numeric levels
    const levelMap = {
      'DEBUG': 0,
      'INFO': 1,
      'WARN': 2,
      'ERROR': 3
    };

    this._logger = {
      level: levelMap.hasOwnProperty(logLevel) ? levelMap[logLevel] : 1,
      _log(level, context, ...args) {
        if (level >= this.level) {
          const method = ['log', 'info', 'warn', 'error'][level] || 'log';
          console[method](`[Deathwatch:${context}]`, ...args);
        }
      }
    };
  }

  /**
   * Log debug message (verbose, for developers).
   * Only shown when log level is DEBUG.
   *
   * @param {string} context - Component name (COMBAT, MODIFIERS, INIT, etc.)
   * @param {...any} args - Arguments to log
   *
   * @example
   * Logger.debug('COMBAT', 'Calculating damage', { damage: 15, penetration: 4 });
   */
  static debug(context, ...args) {
    if (!this._logger) this.init();
    this._logger._log(0, context, ...args);
  }

  /**
   * Log info message (important events).
   * Shown at INFO level and above.
   *
   * @param {string} context - Component name
   * @param {...any} args - Arguments to log
   *
   * @example
   * Logger.info('INIT', 'System initialization complete');
   */
  static info(context, ...args) {
    if (!this._logger) this.init();
    this._logger._log(1, context, ...args);
  }

  /**
   * Log warning (recoverable errors, deprecated usage).
   * Shown at WARN level and above.
   *
   * @param {string} context - Component name
   * @param {...any} args - Arguments to log
   *
   * @example
   * Logger.warn('MODIFIERS', 'Deprecated modifier type "bonus" used, use "characteristic" instead');
   */
  static warn(context, ...args) {
    if (!this._logger) this.init();
    this._logger._log(2, context, ...args);
  }

  /**
   * Log error (unrecoverable errors).
   * Always shown regardless of log level.
   *
   * @param {string} context - Component name
   * @param {...any} args - Arguments to log
   *
   * @example
   * Logger.error('SKILLS', 'Skills not loaded. Call SkillLoader.init() first.');
   */
  static error(context, ...args) {
    if (!this._logger) this.init();
    this._logger._log(3, context, ...args);
  }

  /**
   * Log compatibility warning for deprecated APIs.
   * Uses Foundry's built-in compatibility warning system.
   *
   * @param {string} message - Deprecation message
   * @param {Object} options - Deprecation options
   * @param {string} options.since - Version when deprecated
   * @param {string} options.until - Version when removed
   *
   * @example
   * Logger.compatibility('rollItemMacro() is deprecated', {
   *   since: '2.0.0',
   *   until: '3.0.0'
   * });
   */
  static compatibility(message, { since, until }) {
    if (typeof foundry !== 'undefined' && foundry.utils?.logCompatibilityWarning) {
      foundry.utils.logCompatibilityWarning(message, {
        since,
        until,
        details: 'See docs/improvements/ for migration guide'
      });
    } else {
      // Fallback if Foundry API not available
      this.warn('COMPATIBILITY', message, `(since ${since}, until ${until})`);
    }
  }
}
