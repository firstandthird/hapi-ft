'use strict';
const Hapi = require('hapi');
const hapiConfi = require('hapi-confi');

class Rapptor {
  constructor(options) {
    this.options = options || {};
    this.options.cwd = this.options.cwd || process.cwd();
    const prefix = this.options.configPrefix || 'rapptor';
    const projectConfig = this.options.configPath || `${this.options.cwd}/conf`;
    // inject rapptor config first
    const configPaths = [
      `${__dirname}/conf`,
      projectConfig,
      { path: this.options.cwd, prefix }
    ];
    this.options.configPath = configPaths;
    if (!this.options.envPrefix) {
      this.options.envPrefix = 'rapptor';
    }
    this.options.configUrl = process.env.RAPPTOR_CONFIG_URL;
    this.isConfigured = false;
    this.sigtermCalled = false;
  }

  // callback should be an async function
  before(callback) {
    this.options.before = callback;
  }

  async setup() {
    const { server, config } = await hapiConfi(Hapi, this.options);
    this.config = config;
    this.server = server;
    this.isConfigured = true;
    return { server, config };
  }

  async start() {
    if (!this.isConfigured) {
      await this.setup();
    }
    const server = this.server;
    const config = this.config;
    const uri = process.env.VIRTUAL_HOST || server.info.uri;
    const listener = () => {
      process.removeListener('SIGTERM', listener);
      this.sigtermCalled = true;
      this.stop(() => { process.exit(0); });
    };
    process.on('SIGTERM', listener);
    await server.start();
    server.log(['server', 'notice'], `Server started: ${uri}`);
    return { server, config };
  }

  async stop() {
    const tags = ['server', 'stopping', 'notice'];
    if (this.sigtermCalled) {
      tags.splice(2, 0, 'sigterm');
    }
    this.server.log(tags, 'Stopping server...');
    await this.server.stop({ timeout: 5000 });
    this.server.log(['server', 'stopped'], 'Server stopped');
  }
}

module.exports = Rapptor;
