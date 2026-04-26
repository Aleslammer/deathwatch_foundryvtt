import { Logger } from '../helpers/logger.mjs';
import { CategoryLoggingConfig } from '../ui/category-logging-config.mjs';

/**
 * Registers all world and client settings for the Deathwatch system.
 */
export class SettingsRegistrar {
  /**
   * Register all system settings
   */
  static register() {
    // Register Cohesion world settings
    game.settings.register('deathwatch', 'cohesion', {
      name: 'Kill-team Cohesion',
      scope: 'world',
      config: false,
      type: Object,
      default: { value: 0, max: 0 }
    });

    game.settings.register('deathwatch', 'squadLeader', {
      name: 'Squad Leader Actor ID',
      scope: 'world',
      config: false,
      type: String,
      default: ''
    });

    game.settings.register('deathwatch', 'cohesionModifier', {
      name: 'Cohesion GM Modifier',
      scope: 'world',
      config: false,
      type: Number,
      default: 0
    });

    game.settings.register('deathwatch', 'cohesionDamageThisRound', {
      name: 'Cohesion Damage This Round',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false
    });

    game.settings.register('deathwatch', 'activeSquadAbilities', {
      name: 'Active Squad Mode Abilities',
      scope: 'world',
      config: false,
      type: Array,
      default: []
    });

    // Log level setting
    game.settings.register('deathwatch', 'logLevel', {
      name: 'Log Level',
      hint: 'Control console verbosity: CONSOLE (always to browser console), DEBUG (verbose), INFO (normal), WARN (warnings only), ERROR (errors only)',
      scope: 'client',
      config: true,
      type: String,
      choices: {
        'CONSOLE': 'Console (Always output)',
        'DEBUG': 'Debug (Verbose)',
        'INFO': 'Info (Normal)',
        'WARN': 'Warnings Only',
        'ERROR': 'Errors Only'
      },
      default: 'INFO',
      onChange: () => {
        // Reinitialize logger with new level
        Logger.init();
      }
    });

    // Category logging setting (hidden, controlled by custom UI)
    game.settings.register('deathwatch', 'enabledLogCategories', {
      scope: 'client',
      config: false,
      type: Array,
      default: [],
      onChange: () => {
        // Reinitialize logger with new categories
        Logger.init();
      }
    });

    // Category logging configuration menu
    game.settings.registerMenu('deathwatch', 'categoryLoggingMenu', {
      name: 'Configure Category Logging',
      label: 'Category Logging',
      hint: 'Enable detailed logging for specific subsystems (Combat, Character, Psychic, Squad, Items, System)',
      icon: 'fas fa-list-check',
      type: CategoryLoggingConfig,
      restricted: false
    });
  }
}
