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

    // Feature flag: V2 sheets
    game.settings.register('deathwatch', 'useV2Sheets', {
      name: 'Use ApplicationV2 Sheets (Experimental)',
      hint: 'Enable the new sheet architecture. Requires reload.',
      scope: 'client',
      config: true,
      type: Boolean,
      default: false,
      onChange: () => window.location.reload()
    });

    // Log level setting
    game.settings.register('deathwatch', 'logLevel', {
      name: 'Log Level',
      hint: 'Control console verbosity: DEBUG (verbose), INFO (normal), WARN (warnings only), ERROR (errors only)',
      scope: 'client',
      config: true,
      type: String,
      choices: {
        'DEBUG': 'Debug (Verbose)',
        'INFO': 'Info (Normal)',
        'WARN': 'Warnings Only',
        'ERROR': 'Errors Only'
      },
      default: 'INFO',
      onChange: () => {
        // Reinitialize logger with new level
        const Logger = game.modules.get('deathwatch')?.api?.Logger;
        if (Logger) Logger.init();
      }
    });
  }
}
